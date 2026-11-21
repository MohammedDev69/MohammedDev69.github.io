# ============================================================================
#  make-assets.ps1  -  regenerates the raster assets the site needs:
#
#     assets/og-cover.png          1200x630  Open Graph / Twitter card
#     assets/icon-512.png          512x512   PWA icon
#     assets/icon-192.png          192x192   PWA icon
#     assets/apple-touch-icon.png  180x180   iOS home screen icon
#
#  Everything is drawn deterministically with System.Drawing so the assets can
#  be rebuilt on any Windows box without design tools. Run from the repo root:
#
#     powershell -ExecutionPolicy Bypass -File tools/make-assets.ps1
# ============================================================================

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "assets"
if (-not (Test-Path $assets)) { New-Item -ItemType Directory -Path $assets | Out-Null }

# palette, mirroring css/style.css
$bgTop    = [System.Drawing.Color]::FromArgb(255, 12, 16, 24)
$bgBot    = [System.Drawing.Color]::FromArgb(255, 5, 7, 11)
$amber    = [System.Drawing.Color]::FromArgb(255, 255, 180, 84)
$amber2   = [System.Drawing.Color]::FromArgb(255, 255, 208, 145)
$mint     = [System.Drawing.Color]::FromArgb(255, 110, 231, 199)
$white    = [System.Drawing.Color]::FromArgb(255, 245, 242, 236)
$mutedTxt = [System.Drawing.Color]::FromArgb(255, 139, 151, 169)
$line     = [System.Drawing.Color]::FromArgb(48, 120, 138, 170)

function New-Canvas([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bgTop, $bgBot, 90.0)
    $g.FillRectangle($brush, $rect)
    $brush.Dispose()
    return @{ Bitmap = $bmp; G = $g }
}

function Add-Grid($g, [int]$w, [int]$h, [int]$step) {
    $pen = New-Object System.Drawing.Pen($line, 1)
    for ($x = 0; $x -lt $w; $x += $step) { $g.DrawLine($pen, $x, 0, $x, $h) }
    for ($y = 0; $y -lt $h; $y += $step) { $g.DrawLine($pen, 0, $y, $w, $y) }
    $pen.Dispose()
}

# a soft amber bloom, drawn as stacked translucent ellipses (no radial brush
# surprises across .NET versions)
function Add-Glow($g, [int]$cx, [int]$cy, [int]$radius, [int]$alpha) {
    for ($i = 6; $i -ge 1; $i--) {
        $r = [int]($radius * $i / 6)
        $a = [int]($alpha * (1.0 - ($i / 7.0)) / 6.0)
        $b = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($a, 255, 180, 84))
        $g.FillEllipse($b, ($cx - $r), ($cy - $r), ($r * 2), ($r * 2))
        $b.Dispose()
    }
}

function New-Font([string]$name, [single]$size, [bool]$bold) {
    $style = [System.Drawing.FontStyle]::Regular
    if ($bold) { $style = [System.Drawing.FontStyle]::Bold }
    return New-Object System.Drawing.Font($name, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

# ---------------------------------------------------------------------------
# Open Graph cover - 1200x630
# ---------------------------------------------------------------------------
function Write-OgCover([string]$path) {
    $w = 1200; $h = 630
    $c = New-Canvas $w $h
    $g = $c.G
    Add-Grid $g $w $h 40
    Add-Glow $g 980 300 430 150

    # right-hand motif: a stylised dual-monitor desk, drawn in flat pixels
    $deskX = 760; $deskY = 250
    $monPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 70, 83, 107), 4)
    $screenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 13, 18, 27))
    # monitor frames
    $g.FillRectangle($screenBrush, $deskX, $deskY, 190, 130)
    $g.DrawRectangle($monPen, $deskX, $deskY, 190, 130)
    $g.FillRectangle($screenBrush, ($deskX + 210), ($deskY + 18), 190, 130)
    $g.DrawRectangle($monPen, ($deskX + 210), ($deskY + 18), 190, 130)
    # stands
    $g.FillRectangle($screenBrush, ($deskX + 80), ($deskY + 130), 30, 26)
    $g.FillRectangle($screenBrush, ($deskX + 290), ($deskY + 148), 30, 26)
    # glowing "code lines" on the screens
    $codePen = New-Object System.Drawing.Pen($amber, 6)
    $mintPen = New-Object System.Drawing.Pen($mint, 6)
    $dimPen  = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 139, 151, 169), 6)
    $g.DrawLine($codePen, ($deskX + 20), ($deskY + 30), ($deskX + 110), ($deskY + 30))
    $g.DrawLine($dimPen,  ($deskX + 20), ($deskY + 55), ($deskX + 160), ($deskY + 55))
    $g.DrawLine($mintPen, ($deskX + 20), ($deskY + 80), ($deskX + 90),  ($deskY + 80))
    $g.DrawLine($dimPen,  ($deskX + 20), ($deskY + 105), ($deskX + 140), ($deskY + 105))
    $g.DrawLine($dimPen,  ($deskX + 232), ($deskY + 48), ($deskX + 350), ($deskY + 48))
    $g.DrawLine($codePen, ($deskX + 232), ($deskY + 74), ($deskX + 300), ($deskY + 74))
    $g.DrawLine($dimPen,  ($deskX + 232), ($deskY + 100), ($deskX + 370), ($deskY + 100))
    # desk slab
    $deskPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 58, 70, 92), 5)
    $g.DrawLine($deskPen, ($deskX - 30), ($deskY + 200), ($deskX + 450), ($deskY + 200))
    $monPen.Dispose(); $codePen.Dispose(); $mintPen.Dispose(); $dimPen.Dispose()
    $screenBrush.Dispose(); $deskPen.Dispose()

    # left text block
    $accent = New-Object System.Drawing.SolidBrush($amber)
    $g.FillRectangle($accent, 88, 150, 6, 250)
    $accent.Dispose()

    $fKick = New-Font "Consolas" 22 $false
    $fName = New-Font "Consolas" 68 $true
    $fRole = New-Font "Consolas" 30 $true
    $fSub  = New-Font "Segoe UI" 24 $false
    $fUrl  = New-Font "Consolas" 22 $false

    $bKick = New-Object System.Drawing.SolidBrush($amber)
    $bName = New-Object System.Drawing.SolidBrush($white)
    $bRole = New-Object System.Drawing.SolidBrush($amber2)
    $bSub  = New-Object System.Drawing.SolidBrush($mutedTxt)
    $bUrl  = New-Object System.Drawing.SolidBrush($mint)

    $g.DrawString("INTERACTIVE PORTFOLIO", $fKick, $bKick, 120, 148)
    $g.DrawString("MOHAMED NASR",        $fName, $bName, 116, 184)
    $g.DrawString("FULL-STACK DEVELOPER", $fRole, $bRole, 120, 274)
    $g.DrawString("TypeScript . Next.js . NestJS", $fSub, $bSub, 120, 330)
    $g.DrawString("Supabase . Python . Docker",    $fSub, $bSub, 120, 364)
    $g.DrawString("Alexandria, Egypt  |  mohammeddev69.github.io", $fUrl, $bUrl, 120, 470)

    $fKick.Dispose(); $fName.Dispose(); $fRole.Dispose(); $fSub.Dispose(); $fUrl.Dispose()
    $bKick.Dispose(); $bName.Dispose(); $bRole.Dispose(); $bSub.Dispose(); $bUrl.Dispose()

    $g.Dispose()
    $c.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $c.Bitmap.Dispose()
    Write-Host "  og-cover.png          1200x630"
}

# ---------------------------------------------------------------------------
# Icons - the 2x2 pixel mark from the favicon, at any size
# ---------------------------------------------------------------------------
function Write-Icon([string]$path, [int]$size, [bool]$maskable) {
    $c = New-Canvas $size $size
    $g = $c.G

    if ($maskable) {
        # maskable icons are cropped to a circle: keep the mark small and centred
        $pad = [int]($size * 0.30)
    } else {
        $pad = [int]($size * 0.24)
    }
    $inner = $size - ($pad * 2)
    $gap = [int]($inner * 0.08)
    $cell = [int](($inner - $gap) / 2)

    $a = New-Object System.Drawing.SolidBrush($amber)
    $b = New-Object System.Drawing.SolidBrush($white)
    $g.FillRectangle($a, $pad, $pad, $cell, $cell)
    $g.FillRectangle($b, ($pad + $cell + $gap), $pad, $cell, $cell)
    $g.FillRectangle($b, $pad, ($pad + $cell + $gap), $cell, $cell)
    $g.FillRectangle($a, ($pad + $cell + $gap), ($pad + $cell + $gap), $cell, $cell)
    $a.Dispose(); $b.Dispose()

    # a thin frame reads better once the icon is scaled down in a tab strip
    $frame = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 255, 180, 84), [single]([Math]::Max(1, $size / 128)))
    $g.DrawRectangle($frame, 1, 1, ($size - 3), ($size - 3))
    $frame.Dispose()

    $g.Dispose()
    $c.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $c.Bitmap.Dispose()
    Write-Host "  $([System.IO.Path]::GetFileName($path))  ${size}x${size}"
}

Write-Host "Generating assets into $assets"
Write-OgCover (Join-Path $assets "og-cover.png")
Write-Icon (Join-Path $assets "icon-512.png") 512 $false
Write-Icon (Join-Path $assets "icon-192.png") 192 $false
Write-Icon (Join-Path $assets "apple-touch-icon.png") 180 $true
Write-Host "Done."
