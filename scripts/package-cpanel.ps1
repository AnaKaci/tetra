param(
    [string]$DistPath = (Join-Path $PSScriptRoot '..\dist'),
    [string]$ArchivePath = (Join-Path $PSScriptRoot '..\tetra-cpanel-ready.zip')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$buildRoot = (Resolve-Path -LiteralPath $DistPath).ProviderPath.TrimEnd('\', '/')
$buildPrefix = $buildRoot + [System.IO.Path]::DirectorySeparatorChar
$archiveFullPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ArchivePath)
if (-not (Test-Path -LiteralPath (Join-Path $buildRoot 'index.html') -PathType Leaf)) {
    throw "Missing production index.html in $buildRoot. Run npm run build first."
}
if ($archiveFullPath.StartsWith($buildPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'The archive must be outside the build directory.'
}
if ((Test-Path -LiteralPath $archiveFullPath -PathType Container) -or [System.IO.Path]::GetExtension($archiveFullPath) -ne '.zip') {
    throw 'ArchivePath must name a ZIP file, not a directory.'
}
$archiveParent = [System.IO.Path]::GetDirectoryName($archiveFullPath)
if (-not (Test-Path -LiteralPath $archiveParent -PathType Container)) {
    throw "Archive parent directory does not exist: $archiveParent"
}

# Build in a temporary sibling file; replace the deliverable only after every
# archived byte has been checked against the production output.
$temporaryArchive = Join-Path $archiveParent ('.tetra-package-' + [guid]::NewGuid().ToString('N') + '.zip')
$files = @(Get-ChildItem -LiteralPath $buildRoot -File -Recurse -Force | Sort-Object FullName)
$expected = @{}
foreach ($file in $files) {
    if (-not $file.FullName.StartsWith($buildPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Source file is outside the production directory: $($file.FullName)"
    }
    $entryName = $file.FullName.Substring($buildPrefix.Length).Replace('\', '/')
    $expected[$entryName] = $file.FullName
}

$archive = $null
try {
    $archive = [System.IO.Compression.ZipFile]::Open($temporaryArchive, [System.IO.Compression.ZipArchiveMode]::Create)
    foreach ($entryName in ($expected.Keys | Sort-Object)) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $expected[$entryName], $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
    $archive.Dispose()
    $archive = [System.IO.Compression.ZipFile]::OpenRead($temporaryArchive)
    if ($archive.Entries.Count -ne $files.Count) { throw 'Archive file count differs from dist.' }
    if ($null -eq $archive.GetEntry('index.html')) { throw 'index.html must be at the archive root.' }
    $verified = @{}
    foreach ($entry in $archive.Entries) {
        if (-not $expected.ContainsKey($entry.FullName) -or $verified.ContainsKey($entry.FullName)) {
            throw "Unexpected or duplicate archive entry: $($entry.FullName)"
        }
        if ($entry.FullName.Contains('\') -or $entry.FullName.StartsWith('/') -or $entry.FullName.Split('/').Contains('..')) {
            throw "Invalid archive path: $($entry.FullName)"
        }
        $stream = $entry.Open()
        $hasher = [System.Security.Cryptography.SHA256]::Create()
        try {
            $entryHash = [System.BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-', '')
        } finally {
            $stream.Dispose()
            $hasher.Dispose()
        }
        $sourceHash = (Get-FileHash -LiteralPath $expected[$entry.FullName] -Algorithm SHA256).Hash
        if ($entryHash -ne $sourceHash) { throw "Archive content differs from dist: $($entry.FullName)" }
        $verified[$entry.FullName] = $true
    }
    $archive.Dispose()
    $archive = $null
    Move-Item -LiteralPath $temporaryArchive -Destination $archiveFullPath -Force
    [pscustomobject]@{
        archive = $archiveFullPath
        source = $buildRoot
        filesVerified = $verified.Count
        rootIndex = $true
        allEntryHashesMatch = $true
        bytes = (Get-Item -LiteralPath $archiveFullPath).Length
        sha256 = (Get-FileHash -LiteralPath $archiveFullPath -Algorithm SHA256).Hash
    } | ConvertTo-Json
} finally {
    if ($null -ne $archive) { $archive.Dispose() }
    if (Test-Path -LiteralPath $temporaryArchive -PathType Leaf) {
        Remove-Item -LiteralPath $temporaryArchive -Force
    }
}
