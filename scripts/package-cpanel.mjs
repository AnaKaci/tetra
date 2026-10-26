import { readFile, readdir, open, rename, unlink } from 'node:fs/promises';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Dependency-free, cross-platform ZIP creator. Package dist contents, never source.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const flag = key => process.argv.find(arg => arg.startsWith(key + '='))?.slice(key.length + 1);
const dist = path.resolve(projectRoot, flag('--dist') || 'dist');
const destination = path.resolve(projectRoot, flag('--out') || 'tetra-cpanel-ready.zip');
const excluded = new Set(['.git', 'node_modules', '.env', '.astro', 'src', 'scripts', 'tests']);
const hashes = new Map();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlink in production output: ' + filename);
    if (entry.isDirectory()) files.push(...await walk(filename));
    else if (entry.isFile()) files.push(filename);
    else throw new Error('Unsupported production file type: ' + filename);
  }
  return files;
}
function localHeader(name, crc, packed, length) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6); // UTF-8
  header.writeUInt16LE(8, 8); // DEFLATE
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(packed, 18);
  header.writeUInt32LE(length, 22);
  header.writeUInt16LE(name.length, 26);
  return header;
}
function centralHeader(name, crc, packed, length, offset) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(8, 10);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(packed, 20);
  header.writeUInt32LE(length, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt32LE(offset, 42);
  return header;
}
function verifyZip(bytes) {
  const end = bytes.length - 22;
  if (end < 0 || bytes.readUInt32LE(end) !== 0x06054b50) throw new Error('ZIP end record missing');
  const count = bytes.readUInt16LE(end + 10);
  let position = bytes.readUInt32LE(end + 16);
  if (count !== hashes.size || position + bytes.readUInt32LE(end + 12) !== end) throw new Error('ZIP entry count or directory invalid');
  const seen = new Set();
  for (let i = 0; i < count; i++) {
    if (bytes.readUInt32LE(position) !== 0x02014b50) throw new Error('ZIP central header invalid');
    const crc = bytes.readUInt32LE(position + 16);
    const packed = bytes.readUInt32LE(position + 20);
    const length = bytes.readUInt32LE(position + 24);
    const nameLength = bytes.readUInt16LE(position + 28);
    const extraLength = bytes.readUInt16LE(position + 30);
    const commentLength = bytes.readUInt16LE(position + 32);
    const offset = bytes.readUInt32LE(position + 42);
    const name = bytes.toString('utf8', position + 46, position + 46 + nameLength);
    if (!hashes.has(name) || seen.has(name) || bytes.readUInt16LE(position + 10) !== 8) throw new Error('Unexpected ZIP entry: ' + name);
    if (bytes.readUInt32LE(offset) !== 0x04034b50) throw new Error('Invalid ZIP local header: ' + name);
    const dataOffset = offset + 30 + bytes.readUInt16LE(offset + 26) + bytes.readUInt16LE(offset + 28);
    const restored = inflateRawSync(bytes.subarray(dataOffset, dataOffset + packed));
    if (restored.length !== length || crc32(restored) !== crc || sha256(restored) !== hashes.get(name)) throw new Error('ZIP data mismatch: ' + name);
    seen.add(name);
    position += 46 + nameLength + extraLength + commentLength;
  }
  if (position !== end || !seen.has('index.html')) throw new Error('ZIP has no root index.html or contains extra entries');
  return seen.size;
}
async function main() {
  if (destination === dist || destination.startsWith(dist + path.sep)) throw new Error('ZIP output must be outside dist');
  const files = (await walk(dist)).sort();
  for (const filename of files) {
    const name = path.relative(dist, filename).split(path.sep).join('/');
    if (!name || name.startsWith('/') || name.split('/').some(part => part === '..' || excluded.has(part)) || /(^|\/)\.env(?:\.|$)/.test(name)) throw new Error('Forbidden archive entry: ' + name);
    hashes.set(name, sha256(await readFile(filename)));
  }
  if (!hashes.has('index.html')) throw new Error('Missing dist/index.html; build first');
  if (files.length >= 65535) throw new Error('ZIP64 is not supported');
  const temporary = path.join(path.dirname(destination), '.tetra-cpanel-' + randomUUID() + '.tmp');
  let handle;
  try {
    handle = await open(temporary, 'wx');
    let offset = 0;
    const directoryEntries = [];
    const append = async bytes => { await handle.writeFile(bytes); offset += bytes.length; };
    for (const filename of files) {
      const name = Buffer.from(path.relative(dist, filename).split(path.sep).join('/'), 'utf8');
      const raw = await readFile(filename);
      const packed = deflateRawSync(raw);
      const crc = crc32(raw);
      if ([raw.length, packed.length, offset].some(n => n > 0xffffffff)) throw new Error('Build exceeds ZIP32 size limit');
      directoryEntries.push([name, crc, packed.length, raw.length, offset]);
      await append(localHeader(name, crc, packed.length, raw.length));
      await append(name);
      await append(packed);
    }
    const centralOffset = offset;
    for (const [name, crc, packed, length, location] of directoryEntries) {
      await append(centralHeader(name, crc, packed, length, location));
      await append(name);
    }
    const centralLength = offset - centralOffset;
    if (centralOffset > 0xffffffff || centralLength > 0xffffffff) throw new Error('ZIP32 directory size limit');
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(files.length, 8);
    end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(centralLength, 12);
    end.writeUInt32LE(centralOffset, 16);
    await append(end);
    await handle.close();
    handle = undefined;
    const bytes = await readFile(temporary);
    const verifiedFiles = verifyZip(bytes);
    await rename(temporary, destination);
    console.log(JSON.stringify({ archive: destination, verifiedFiles, rootIndex: true, bytes: bytes.length, sha256: sha256(bytes) }, null, 2));
  } finally {
    if (handle) await handle.close();
    await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}
await main();
