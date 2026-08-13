# Requires: Windows PowerShell 5+
# Deletes leftover files that are NOT in OFFICIAL_FILELIST.txt
param(
  [string]$Root = "",
  [string]$SyncFrom = "",
  [switch]$Apply
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")
if (-not $Root) { $Root = [string]$RepoRoot }
$Root = [System.IO.Path]::GetFullPath($Root)
if ($SyncFrom) { $SyncFrom = [System.IO.Path]::GetFullPath($SyncFrom) }

$ProtectedDirs = @(".git", "node_modules", ".next", ".cache", ".vscode", ".idea", ".arena")
$ProtectedFiles = @(".env", ".env.local", ".env.ndcohub", ".env.production", ".env.development")
$KnownExtras = @(
  "__rzi_4828.46476.rartemp",
  "CHANGELOG_ENHANCEMENTS.md",
  "public/crm-enhancements.js",
  "public/data/iran-provinces.geojson",
  "public/icon.svg",
  "public/logo.svg",
  "public/src-svg/brand-1280x720.svg",
  "public/src-svg/desktop-1280x720.svg",
  "public/src-svg/mobile-720x1280.svg",
  "src/app/api/messengers/test/route.ts",
  "app.js", "data.js", "index.html", "style.css", "sw.js", "manifest.json",
  "crm-app-all-in-one.html", "crm-app-complete.zip", "README_FA_NEXTJS.md",
  "add_calendar_logic.py", "add_missing_funcs.py", "add_modals_and_search.py",
  "add_products_tab.py", "add_save_handlers.py", "apply_html_v9.py",
  "check_all_js.py", "expand_cities.py", "fix_syntax.py", "fix_tabs_and_cards.py",
  "public/app.js", "public/data.js", "public/crm-features.js",
  "public/crm-features-v1.js", "public/crm-features-v2.js", "public/crm-features-v3.js",
  "public/crm-features-v4.js", "public/crm-features-v5.js", "public/crm-features-v6.js",
  "public/crm-features-v7.js", "public/crm-features-v8.js"
)

function Norm([string]$p) { return ($p -replace "\\", "/") }

function IsProtected([string]$rel) {
  $n = Norm $rel
  if (-not $n) { return $true }
  $parts = $n.Split("/")
  foreach ($p in $parts) { if ($ProtectedDirs -contains $p) { return $true } }
  $base = $parts[-1]
  if ($ProtectedFiles -contains $base) { return $true }
  if ($base.StartsWith(".env") -and -not $base.EndsWith(".example")) { return $true }
  if ($base.StartsWith("crm-backup")) { return $true }
  return $false
}

function Get-RelFiles([string]$base) {
  $out = New-Object System.Collections.Generic.List[string]
  Get-ChildItem -LiteralPath $base -Recurse -Force -File | ForEach-Object {
    $rel = Norm $_.FullName.Substring($base.Length).TrimStart("\", "/")
    if (-not (IsProtected $rel)) { [void]$out.Add($rel) }
  }
  return $out
}

$listRoot = $(if ($SyncFrom) { $SyncFrom } else { [string]$RepoRoot })
$listFile = Join-Path $listRoot "OFFICIAL_FILELIST.txt"
if (-not (Test-Path -LiteralPath $listFile)) {
  Write-Host "OFFICIAL_FILELIST.txt پیدا نشد: $listFile"
  exit 1
}
$official = New-Object "System.Collections.Generic.HashSet[string]"
Get-Content -LiteralPath $listFile -Encoding UTF8 | ForEach-Object {
  $t = $_.Trim()
  if ($t) { [void]$official.Add((Norm $t)) }
}

$existing = Get-RelFiles $Root
$toDelete = @()
foreach ($rel in $existing) {
  $n = Norm $rel
  if ($n -eq "OFFICIAL_FILELIST.txt") { continue }
  if (IsProtected $n) { continue }
  $drop = $false
  if ($KnownExtras -contains $n) { $drop = $true }
  elseif ($n.EndsWith(".rartemp") -or $n.Contains("__rzi_")) { $drop = $true }
  elseif (-not $official.Contains($n)) { $drop = $true }
  if ($drop) { $toDelete += $n }
}

Write-Host "root: $Root"
Write-Host "official files: $($official.Count)"
Write-Host "present files: $($existing.Count)"
Write-Host "extra files: $($toDelete.Count)"
$toDelete | ForEach-Object { Write-Host "  DEL $_" }

if ($SyncFrom -and $Apply) {
  Write-Host "copy from: $SyncFrom"
  $srcFiles = Get-RelFiles $SyncFrom | Where-Object { $official.Contains($_) -or $_ -eq "OFFICIAL_FILELIST.txt" }
  foreach ($rel in $srcFiles) {
    $src = Join-Path $SyncFrom ($rel -replace "/", "\")
    $dst = Join-Path $Root ($rel -replace "/", "\")
    $dstDir = Split-Path -Parent $dst
    if (-not (Test-Path -LiteralPath $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    Copy-Item -LiteralPath $src -Destination $dst -Force
  }
  Copy-Item -LiteralPath (Join-Path $SyncFrom "OFFICIAL_FILELIST.txt") -Destination (Join-Path $Root "OFFICIAL_FILELIST.txt") -Force
}

if (-not $Apply) {
  Write-Host ""
  Write-Host "dry-run. برای حذف واقعی سوییچ -Apply بزنید."
  exit 0
}

foreach ($rel in $toDelete) {
  $abs = Join-Path $Root ($rel -replace "/", "\")
  try { Remove-Item -LiteralPath $abs -Force } catch { Write-Host "نتوانست حذف شود: $rel" }
}

Get-ChildItem -LiteralPath $Root -Recurse -Force -Directory | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object {
  $rel = Norm $_.FullName.Substring($Root.Length).TrimStart("\", "/")
  if (IsProtected $rel) { return }
  $left = @(Get-ChildItem -LiteralPath $_.FullName -Force)
  if ($left.Count -eq 0) {
    Remove-Item -LiteralPath $_.FullName -Force
    Write-Host "  RMDIR $rel"
  }
}

Write-Host "done. deleted files=$($toDelete.Count)"
