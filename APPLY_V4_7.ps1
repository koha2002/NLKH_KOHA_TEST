$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = (Get-Location).Path

if (-not (Test-Path (Join-Path $repo "lib\admin-seo.ts"))) {
  throw "Hãy chạy script tại root NLKH_KOHA_TEST. Không tìm thấy lib\admin-seo.ts"
}
if (-not (Test-Path (Join-Path $repo "admin\src\main.jsx"))) {
  throw "Không tìm thấy admin\src\main.jsx"
}

$utf8 = New-Object System.Text.UTF8Encoding($false)

# 1) Favicon branding fallback: Admin public URL if usable, otherwise /favicon.png.
$seoPath = Join-Path $repo "lib\admin-seo.ts"
$seo = [System.IO.File]::ReadAllText($seoPath)
$old = 'const favicon = String(site.favicon_url || "").trim();'
$new = 'const favicon = String(site.favicon_url || "/favicon.png").trim();'
if ($seo.Contains($old)) {
  $seo = $seo.Replace($old, $new)
  [System.IO.File]::WriteAllText($seoPath, $seo, $utf8)
  Write-Host "OK: favicon fallback -> /favicon.png" -ForegroundColor Green
} elseif ($seo.Contains('/favicon.png')) {
  Write-Host "OK: favicon fallback đã có sẵn" -ForegroundColor Green
} else {
  throw "Không tìm thấy dòng favicon dự kiến trong lib\admin-seo.ts"
}

# 2) Copy favicon old site to public fallback.
Copy-Item (Join-Path $root "public\favicon.png") (Join-Path $repo "public\favicon.png") -Force
Write-Host "OK: public\favicon.png" -ForegroundColor Green

# 3) Add independent Admin scroll stylesheet.
Copy-Item (Join-Path $root "admin\src\scroll-fix.css") (Join-Path $repo "admin\src\scroll-fix.css") -Force
$mainPath = Join-Path $repo "admin\src\main.jsx"
$main = [System.IO.File]::ReadAllText($mainPath)
if (-not $main.Contains('import"./scroll-fix.css"')) {
  if ($main.Contains('import"./styles.css";')) {
    $main = $main.Replace('import"./styles.css";', 'import"./styles.css";import"./scroll-fix.css";')
  } elseif ($main.Contains('import "./styles.css";')) {
    $main = $main.Replace('import "./styles.css";', 'import "./styles.css";' + [Environment]::NewLine + 'import "./scroll-fix.css";')
  } else {
    throw "Không tìm thấy import styles.css trong admin\src\main.jsx"
  }
  [System.IO.File]::WriteAllText($mainPath, $main, $utf8)
  Write-Host "OK: Admin import scroll-fix.css" -ForegroundColor Green
} else {
  Write-Host "OK: scroll-fix.css đã được import" -ForegroundColor Green
}

Write-Host "V4.7 applied. Bây giờ build frontend + admin." -ForegroundColor Cyan
