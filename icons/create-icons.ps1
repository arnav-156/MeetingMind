# Simple Icon Creator - PowerShell Version
# Creates basic placeholder icons for MeetingMind extension

Write-Host "🎨 Creating MeetingMind Icons..." -ForegroundColor Cyan

# We'll create simple SVG files and note that they need conversion
# Since PowerShell can't easily create PNGs without external tools

$svgContent16 = @"
<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="16" height="16" fill="url(#grad1)" rx="3"/>
  <text x="8" y="12" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">M</text>
</svg>
"@

$svgContent48 = @"
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="48" height="48" fill="url(#grad1)" rx="8"/>
  <text x="24" y="34" text-anchor="middle" fill="white" font-family="Arial" font-size="28" font-weight="bold">M</text>
</svg>
"@

$svgContent128 = @"
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#grad1)" rx="20"/>
  <text x="64" y="90" text-anchor="middle" fill="white" font-family="Arial" font-size="72" font-weight="bold">M</text>
</svg>
"@

# Save SVG files
$svgContent16 | Out-File -FilePath "icon16.svg" -Encoding UTF8
$svgContent48 | Out-File -FilePath "icon48.svg" -Encoding UTF8
$svgContent128 | Out-File -FilePath "icon128.svg" -Encoding UTF8

Write-Host "✅ SVG files created!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Note: Chrome extensions need PNG files, not SVG." -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 To convert SVG to PNG, you can:" -ForegroundColor Cyan
Write-Host "   1. Use online tool: https://cloudconvert.com/svg-to-png" -ForegroundColor White
Write-Host "   2. Use GIMP (free): Open SVG → Export as PNG" -ForegroundColor White
Write-Host "   3. Use Inkscape: inkscape icon16.svg --export-png=icon16.png" -ForegroundColor White
Write-Host "   4. Or skip icons for now - extension works without them!" -ForegroundColor White
Write-Host ""
Write-Host "⚡ Quick Option: Extension will work fine without icons (shows warnings)" -ForegroundColor Green
