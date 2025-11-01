# ============================================
# Verify GitHub Pages Deployment
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GITHUB PAGES VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$privacyUrl = "https://arnav-156.github.io/MeetingMind/privacy-policy.html"

Write-Host "Checking if privacy policy is live..." -ForegroundColor Yellow
Write-Host "URL: $privacyUrl`n" -ForegroundColor White

$maxAttempts = 10
$attempt = 1
$deployed = $false

while ($attempt -le $maxAttempts -and -not $deployed) {
    Write-Host "Attempt $attempt of $maxAttempts..." -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $privacyUrl -Method Head -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $deployed = $true
            Write-Host "`n[OK] Privacy policy is LIVE!" -ForegroundColor Green
            Write-Host "[OK] Status: $($response.StatusCode) OK" -ForegroundColor Green
            Write-Host "[OK] URL: $privacyUrl`n" -ForegroundColor Green
        }
    } catch {
        if ($attempt -lt $maxAttempts) {
            Write-Host "   Not ready yet, waiting 15 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 15
        }
    }
    
    $attempt++
}

if (-not $deployed) {
    Write-Host "`n[WARNING] Privacy policy not accessible yet" -ForegroundColor Yellow
    Write-Host "This is normal - GitHub Pages can take 2-5 minutes to deploy`n" -ForegroundColor Yellow
    Write-Host "What to do:" -ForegroundColor White
    Write-Host "  1. Wait a few more minutes" -ForegroundColor White
    Write-Host "  2. Visit: $privacyUrl" -ForegroundColor Cyan
    Write-Host "  3. Make sure GitHub Pages is enabled in repo settings`n" -ForegroundColor White
} else {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ALL DONE!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Your MeetingMind repository is ready:" -ForegroundColor White
    Write-Host "  Repository: https://github.com/arnav-156/MeetingMind" -ForegroundColor Cyan
    Write-Host "  Privacy Policy: $privacyUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps for Chrome Web Store:" -ForegroundColor White
    Write-Host "  1. Create screenshots (see SCREENSHOT_GUIDE.md)" -ForegroundColor White
    Write-Host "  2. Run final QA tests (see READY_TO_LAUNCH.md)" -ForegroundColor White
    Write-Host "  3. Create ZIP package" -ForegroundColor White
    Write-Host "  4. Submit to Chrome Web Store (see SUBMISSION_CHECKLIST.md)`n" -ForegroundColor White
}

Write-Host "========================================`n" -ForegroundColor Cyan
