$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $scriptDir

Write-Host "Repo:" $repo

function Write-Utf8NoBom([string]$Path, [string]$Text) {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Text, $utf8)
}

# 1) Frontend favicon + Admin favicon
$frontPublic = Join-Path $repo "public"
$adminPublic = Join-Path $repo "admin\public"
New-Item -ItemType Directory -Force $frontPublic | Out-Null
New-Item -ItemType Directory -Force $adminPublic | Out-Null

Copy-Item (Join-Path $scriptDir "files\public\favicon.png") (Join-Path $frontPublic "favicon.png") -Force
Copy-Item (Join-Path $scriptDir "files\admin\public\favicon.png") (Join-Path $adminPublic "favicon.png") -Force
Write-Host "OK: frontend + admin favicon.png"

# 2) Admin favicon link with cache-busting
$adminIndex = Join-Path $repo "admin\index.html"
if (!(Test-Path $adminIndex)) { throw "Khong tim thay admin\index.html" }

$html = [System.IO.File]::ReadAllText($adminIndex)
$newIcon = '<link rel="icon" type="image/png" sizes="64x64" href="/favicon.png?v=471"/>'

if ($html -match '<link[^>]+rel=["'']icon["''][^>]*>') {
    $html = [regex]::Replace(
        $html,
        '<link[^>]+rel=["'']icon["''][^>]*>',
        $newIcon,
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
} else {
    $html = $html.Replace("<title>", "$newIcon<title>")
}
Write-Utf8NoBom $adminIndex $html
Write-Host "OK: admin/index.html favicon link"

# 3) Larger Admin sidebar brand
$brandCssSrc = Join-Path $scriptDir "files\admin\src\brand-fix.css"
$brandCssDst = Join-Path $repo "admin\src\brand-fix.css"
Copy-Item $brandCssSrc $brandCssDst -Force

$main = Join-Path $repo "admin\src\main.jsx"
if (!(Test-Path $main)) { throw "Khong tim thay admin\src\main.jsx" }

$mainText = [System.IO.File]::ReadAllText($main)
if ($mainText -notmatch 'brand-fix\.css') {
    if ($mainText -match 'import"\./scroll-fix\.css";') {
        $mainText = $mainText.Replace('import"./scroll-fix.css";', 'import"./scroll-fix.css";import"./brand-fix.css";')
    } elseif ($mainText -match 'import"\./styles\.css";') {
        $mainText = $mainText.Replace('import"./styles.css";', 'import"./styles.css";import"./brand-fix.css";')
    } else {
        $mainText = 'import"./brand-fix.css";' + $mainText
    }
    Write-Utf8NoBom $main $mainText
}
Write-Host "OK: Admin brand CSS imported"

# 4) Ensure metadata fallback remains /favicon.png
$seo = Join-Path $repo "lib\admin-seo.ts"
if (Test-Path $seo) {
    $seoText = [System.IO.File]::ReadAllText($seo)
    $seoNew = [regex]::Replace(
        $seoText,
        'const favicon\s*=\s*String\(site\.favicon_url\s*\|\|\s*""\)\.trim\(\);',
        'const favicon = String(site.favicon_url || "/favicon.png").trim();'
    )
    if ($seoNew -ne $seoText) {
        Write-Utf8NoBom $seo $seoNew
        Write-Host "OK: favicon fallback -> /favicon.png"
    } else {
        Write-Host "INFO: favicon fallback da co hoac code khac format."
    }
}

Write-Host ""
Write-Host "V4.7.1 applied." -ForegroundColor Green
Write-Host "Build frontend: npm.cmd run build"
Write-Host "Build admin: cd admin; npm.cmd run build; cd .."
