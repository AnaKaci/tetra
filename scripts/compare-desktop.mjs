import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const baselineDirectory = resolve('tests/mobile/baseline');
const screenshotDirectory = resolve('tests/mobile/screenshots');
const reportPath = resolve('tests/mobile/desktop-comparison.json');
const baselineFiles = (await readdir(baselineDirectory)).filter(name => name.endsWith('-1440.png')).sort();
const currentFiles = new Set(await readdir(screenshotDirectory).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return [];
}));
const comparisons = [];

for (const name of baselineFiles) {
  if (!currentFiles.has(name)) {
    comparisons.push({ file: name, status: 'not-captured' });
    continue;
  }
  const [baseline, current, baselineStat, currentStat] = await Promise.all([
    sharp(await readFile(resolve(baselineDirectory, name))).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(await readFile(resolve(screenshotDirectory, name))).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    stat(resolve(baselineDirectory, name)),
    stat(resolve(screenshotDirectory, name)),
  ]);
  const capturedAt = { baseline: baselineStat.mtime.toISOString(), current: currentStat.mtime.toISOString() };
  const originalSize = { width: baseline.info.width, height: baseline.info.height };
  const currentSize = { width: current.info.width, height: current.info.height };
  if (baseline.info.width !== current.info.width || baseline.info.height !== current.info.height) {
    comparisons.push({ file: name, status: 'different-dimensions', capturedAt, originalSize, currentSize });
    continue;
  }
  const { width, height } = baseline.info;
  let changedPixels = 0, changedHeaderPixels = 0, maxChannelDifference = 0, pixelsExceedingTolerance = 0;
  let left = width, right = -1, top = height, bottom = -1;
  const changedRows = [];
  for (let y = 0; y < height; y++) {
    let rowChanged = false;
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      let changed = false, exceedsTolerance = false;
      for (let channel = 0; channel < 4; channel++) {
        const difference = Math.abs(baseline.data[offset + channel] - current.data[offset + channel]);
        if (difference) changed = true;
        if (difference > 1) exceedsTolerance = true;
        maxChannelDifference = Math.max(maxChannelDifference, difference);
      }
      if (!changed) continue;
      changedPixels++;
      if (exceedsTolerance) pixelsExceedingTolerance++;
      if (y < 85) changedHeaderPixels++;
      rowChanged = true;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (rowChanged) {
      const last = changedRows.at(-1);
      if (last && last.end === y - 1) last.end = y;
      else changedRows.push({ start: y, end: y });
    }
  }
  comparisons.push({
    file: name,
    capturedAt,
    status: pixelsExceedingTolerance ? 'different-pixels' : changedPixels ? 'within-raster-tolerance' : 'identical',
    originalSize, currentSize,
    changedPixels,
    changedPercentage: Number((100 * changedPixels / (width * height)).toFixed(6)),
    changedHeaderPixels,
    maxChannelDifference,
    pixelsExceedingTolerance,
    differenceBounds: changedPixels ? { left, top, right, bottom } : null,
    changedRows,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  method: 'RGBA pixel comparison of full-page Chromium screenshots at 1440px, with reduced motion. Pass requires matching image dimensions and no channel difference exceeding 1/255 (one color level of rasterization tolerance). Exact pixel differences are retained. Header metric compares the first 85 rows.',
  channelTolerance: 1,
  baselineDirectory, screenshotDirectory,
  expected: baselineFiles.length,
  compared: comparisons.filter(item => item.status !== 'not-captured').length,
  identical: comparisons.filter(item => item.status === 'identical').length,
  withinRasterTolerance: comparisons.filter(item => item.status === 'within-raster-tolerance').length,
  differences: comparisons.filter(item => ['different-pixels', 'different-dimensions'].includes(item.status)).length,
  pending: comparisons.filter(item => item.status === 'not-captured').length,
  comparisons,
};
report.status = report.differences ? 'fail' : report.pending || !report.expected ? 'incomplete' : 'pass';
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ report: reportPath, status: report.status, expected: report.expected, compared: report.compared, identical: report.identical, withinRasterTolerance: report.withinRasterTolerance, differences: report.differences, pending: report.pending }, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
