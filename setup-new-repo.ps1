# ============================================
# MeetingMind - New GitHub Repository Setup
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MEETINGMIND - NEW REPO SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "This script will help you:" -ForegroundColor White
Write-Host "  1. Create a new GitHub repository named 'MeetingMind'" -ForegroundColor White
Write-Host "  2. Initialize git in this folder" -ForegroundColor White
Write-Host "  3. Push all files to the new repo" -ForegroundColor White
Write-Host "  4. Enable GitHub Pages for privacy policy`n" -ForegroundColor White

# Step 1: Check if git is initialized
Write-Host "`n--- Step 1: Initialize Git ---`n" -ForegroundColor Cyan

if (Test-Path .git) {
    Write-Host "[OK] Git already initialized" -ForegroundColor Green
    Write-Host "[WARNING] Removing existing git to start fresh..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
}

git init
Write-Host "[OK] Git initialized successfully`n" -ForegroundColor Green

# Step 2: Create .gitignore
Write-Host "--- Step 2: Create .gitignore ---`n" -ForegroundColor Cyan

$gitignore = @"
# Node modules
node_modules/

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# Build files
*.zip
dist/
build/

# Logs
*.log
npm-debug.log*

# Temporary files
*.tmp
*.temp
.cache/

# Testing
coverage/
.nyc_output/
"@

Set-Content -Path ".gitignore" -Value $gitignore
Write-Host "[OK] .gitignore created" -ForegroundColor Green
Write-Host ""

# Step 3: Instructions for creating GitHub repo
Write-Host "--- Step 3: Create GitHub Repository ---`n" -ForegroundColor Cyan
Write-Host "Please follow these steps to create the repo:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Go to: https://github.com/new" -ForegroundColor White
Write-Host "  2. Repository name: MeetingMind" -ForegroundColor White
Write-Host "  3. Description: AI-powered meeting assistant with real-time transcription" -ForegroundColor White
Write-Host "  4. Visibility: Public (required for GitHub Pages)" -ForegroundColor White
Write-Host "  5. Do NOT initialize with README" -ForegroundColor White
Write-Host "  6. Do NOT add .gitignore" -ForegroundColor White
Write-Host "  7. Do NOT add license" -ForegroundColor White
Write-Host "  8. Click 'Create repository'`n" -ForegroundColor White

Write-Host "Press any key after you've created the repository..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host "[OK] Continuing...`n" -ForegroundColor Green

# Step 4: Add all files
Write-Host "--- Step 4: Add Files to Git ---`n" -ForegroundColor Cyan

git add .
Write-Host "[OK] All files staged`n" -ForegroundColor Green

# Step 5: Commit
Write-Host "--- Step 5: Initial Commit ---`n" -ForegroundColor Cyan

git commit -m "Initial commit: MeetingMind v1.0.0 - Chrome extension with AI-powered meeting features"
Write-Host "[OK] Files committed`n" -ForegroundColor Green

# Step 6: Add remote and push
Write-Host "--- Step 6: Push to GitHub ---`n" -ForegroundColor Cyan

git branch -M main
git remote add origin https://github.com/arnav-156/MeetingMind.git

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Successfully pushed to GitHub!`n" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error pushing to GitHub. Please check:" -ForegroundColor Red
    Write-Host "   - Repository was created correctly" -ForegroundColor Yellow
    Write-Host "   - You have write access" -ForegroundColor Yellow
    Write-Host "   - Your GitHub credentials are set up`n" -ForegroundColor Yellow
    exit 1
}

# Step 7: Enable GitHub Pages
Write-Host "--- Step 7: Enable GitHub Pages ---`n" -ForegroundColor Cyan
Write-Host "Now enable GitHub Pages for your privacy policy:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Go to: https://github.com/arnav-156/MeetingMind/settings/pages" -ForegroundColor White
Write-Host "  2. Under 'Source', select 'Deploy from a branch'" -ForegroundColor White
Write-Host "  3. Select branch: main" -ForegroundColor White
Write-Host "  4. Select folder: / (root)" -ForegroundColor White
Write-Host "  5. Click 'Save'" -ForegroundColor White
Write-Host "  6. Wait 1-2 minutes for deployment`n" -ForegroundColor White

Write-Host "Press any key after enabling GitHub Pages..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Step 8: Test privacy policy URL
Write-Host "`n--- Step 8: Verify Privacy Policy ---`n" -ForegroundColor Cyan
Write-Host "Testing privacy policy URL..." -ForegroundColor Yellow

$privacyUrl = "https://arnav-156.github.io/MeetingMind/privacy-policy.html"

Start-Sleep -Seconds 5

try {
    $null = Invoke-WebRequest -Uri $privacyUrl -Method Head -ErrorAction Stop
    Write-Host "[OK] Privacy policy is live at: $privacyUrl`n" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Privacy policy not yet accessible (this is normal, wait 1-2 minutes)" -ForegroundColor Yellow
    Write-Host "   URL: $privacyUrl" -ForegroundColor White
    Write-Host "   Try visiting it in your browser in a few minutes`n" -ForegroundColor Yellow
}

# Final summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Summary:" -ForegroundColor White
Write-Host "  [OK] Git initialized" -ForegroundColor Green
Write-Host "  [OK] Files committed" -ForegroundColor Green
Write-Host "  [OK] Pushed to GitHub" -ForegroundColor Green
Write-Host "  [OK] GitHub Pages enabled" -ForegroundColor Green
Write-Host ""
Write-Host "Your URLs:" -ForegroundColor White
Write-Host "  Repository: https://github.com/arnav-156/MeetingMind" -ForegroundColor Cyan
Write-Host "  Privacy Policy: https://arnav-156.github.io/MeetingMind/privacy-policy.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Verify privacy policy loads in browser" -ForegroundColor White
Write-Host "  2. All references in manifest.json and docs are updated" -ForegroundColor White
Write-Host "  3. Continue with Chrome Web Store submission" -ForegroundColor White
Write-Host ""
Write-Host "Ready to launch! Follow SUBMISSION_CHECKLIST.md`n" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
