# ============================================
# MeetingMind - Chrome Web Store Package Creator
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MEETINGMIND PACKAGE CREATOR" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$version = "1.0.0"
$packageName = "MeetingMind-v$version.zip"
$workingDir = Get-Location

# Files and folders to INCLUDE
$includeItems = @(
    "manifest.json",
    "background.js",
    "content",
    "sidepanel",
    "popup",
    "utils",
    "icons",
    "privacy-policy.html"
)

# Files and patterns to EXCLUDE
$excludePatterns = @(
    "*.md",
    "*.ps1",
    ".git*",
    "*.log",
    "*.tmp",
    "node_modules",
    "*.zip",
    ".vscode",
    ".idea",
    "screenshots",
    "demo.*",
    "test.*"
)

Write-Host "Preparing to create package: $packageName`n" -ForegroundColor White

# Check if required files exist
Write-Host "--- Step 1: Validating Files ---`n" -ForegroundColor Cyan

$missingFiles = @()
foreach ($item in $includeItems) {
    if (-not (Test-Path $item)) {
        $missingFiles += $item
        Write-Host "[ERROR] Missing: $item" -ForegroundColor Red
    } else {
        Write-Host "[OK] Found: $item" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n[ERROR] Cannot create package. Missing required files." -ForegroundColor Red
    exit 1
}

# Create temporary directory
Write-Host "`n--- Step 2: Creating Temporary Directory ---`n" -ForegroundColor Cyan

$tempDir = Join-Path $env:TEMP "MeetingMind-Package-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "[OK] Temp directory: $tempDir" -ForegroundColor Green

# Copy files to temp directory
Write-Host "`n--- Step 3: Copying Files ---`n" -ForegroundColor Cyan

$copiedCount = 0
foreach ($item in $includeItems) {
    $destination = Join-Path $tempDir (Split-Path $item -Leaf)
    
    if (Test-Path $item -PathType Container) {
        # It's a directory
        Copy-Item -Path $item -Destination $destination -Recurse -Force
        $fileCount = (Get-ChildItem -Path $destination -Recurse -File).Count
        Write-Host "[OK] Copied folder: $item ($fileCount files)" -ForegroundColor Green
        $copiedCount += $fileCount
    } else {
        # It's a file
        Copy-Item -Path $item -Destination $destination -Force
        Write-Host "[OK] Copied file: $item" -ForegroundColor Green
        $copiedCount++
    }
}

Write-Host "`nTotal files copied: $copiedCount" -ForegroundColor White

# Remove excluded files from temp directory
Write-Host "`n--- Step 4: Removing Excluded Files ---`n" -ForegroundColor Cyan

$removedCount = 0
foreach ($pattern in $excludePatterns) {
    $filesToRemove = Get-ChildItem -Path $tempDir -Recurse -Force | Where-Object { $_.Name -like $pattern }
    foreach ($file in $filesToRemove) {
        Remove-Item -Path $file.FullName -Force -Recurse -ErrorAction SilentlyContinue
        $removedCount++
    }
}

if ($removedCount -gt 0) {
    Write-Host "[OK] Removed $removedCount excluded items" -ForegroundColor Green
} else {
    Write-Host "[OK] No excluded items found" -ForegroundColor Green
}

# Count final files
$finalFiles = Get-ChildItem -Path $tempDir -Recurse -File
$totalSize = ($finalFiles | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "`n--- Step 5: Package Summary ---`n" -ForegroundColor Cyan
Write-Host "Files in package: $($finalFiles.Count)" -ForegroundColor White
Write-Host "Total size: $totalSizeMB MB" -ForegroundColor White

# Create ZIP file
Write-Host "`n--- Step 6: Creating ZIP File ---`n" -ForegroundColor Cyan

$zipPath = Join-Path $workingDir $packageName

# Remove existing ZIP if present
if (Test-Path $zipPath) {
    Write-Host "[WARNING] Removing existing $packageName" -ForegroundColor Yellow
    Remove-Item $zipPath -Force
}

# Create ZIP
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)
    Write-Host "[OK] Created: $packageName" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create ZIP: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

# Verify ZIP file
Write-Host "`n--- Step 7: Verifying Package ---`n" -ForegroundColor Cyan

if (Test-Path $zipPath) {
    $zipSize = (Get-Item $zipPath).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)
    Write-Host "[OK] Package created successfully!" -ForegroundColor Green
    Write-Host "[OK] Location: $zipPath" -ForegroundColor Green
    Write-Host "[OK] Size: $zipSizeMB MB" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Package verification failed" -ForegroundColor Red
    exit 1
}

# Final summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           PACKAGE COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Package Details:" -ForegroundColor White
Write-Host "  Name: $packageName" -ForegroundColor Cyan
Write-Host "  Files: $($finalFiles.Count)" -ForegroundColor Cyan
Write-Host "  Size: $zipSizeMB MB" -ForegroundColor Cyan
Write-Host "  Location: $zipPath" -ForegroundColor Cyan

Write-Host "`nNext Steps:" -ForegroundColor White
Write-Host "  1. Test the package by loading it as unpacked extension" -ForegroundColor White
Write-Host "  2. Go to Chrome Web Store Developer Dashboard" -ForegroundColor White
Write-Host "  3. Click 'New Item' and upload $packageName" -ForegroundColor White
Write-Host "  4. Fill in store listing details" -ForegroundColor White
Write-Host "  5. Submit for review" -ForegroundColor White

Write-Host "`nReady to submit! " -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
