# Packaging script for MCPDOM v3 Platform
$ErrorActionPreference = "Stop"

$workspaceRoot = $PSScriptRoot | Split-Path -Parent
$outputZip = "c:\Users\ASUS\Downloads\mcpdom-browser-v3-complete-ai-agent-package\mcpdom-v3-ai-agent-package.zip"

Write-Host "Packaging MCPDOM v3 from: $workspaceRoot"
Write-Host "Output ZIP target: $outputZip"

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

# Create a clean staging directory
$stagingDir = Join-Path $env:TEMP ("mcpdom-staging-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

$includeDirs = @(
    ".agents",
    "src",
    "bin",
    "chrome-extension",
    "docs",
    "operational-tests",
    "tests",
    "scripts",
    "schemas",
    "icons"
)

$includeFiles = @(
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "vite.config.extension.ts",
    "vite.config.server.ts",
    "vite.config.sea.ts",
    "vitest.config.ts",
    "sea-config.json",
    "manifest.json",
    "README.md",
    "AGENT_DEVELOPER_GUIDE.md",
    "Build-All.bat",
    "Check-Bridge-Status.bat",
    "Install-Dependencies.bat",
    "Run-Tests.bat",
    "Start-Bridge-Server.bat",
    ".gitignore"
)

# Copy directories
foreach ($dir in $includeDirs) {
    $src = Join-Path $workspaceRoot $dir
    if (Test-Path $src) {
        $dest = Join-Path $stagingDir $dir
        Write-Host "Copying directory: $dir -> $dest"
        Copy-Item -Path $src -Destination $dest -Recurse -Force
    }
}

# Copy root files
foreach ($file in $includeFiles) {
    $src = Join-Path $workspaceRoot $file
    if (Test-Path $src) {
        $dest = Join-Path $stagingDir $file
        Write-Host "Copying file: $file"
        Copy-Item -Path $src -Destination $dest -Force
    }
}

Write-Host "Compressing archive to $outputZip..."
Compress-Archive -Path "$stagingDir\*" -DestinationPath $outputZip -CompressionLevel Optimal

# Cleanup staging
Remove-Item -Path $stagingDir -Recurse -Force

$zipInfo = Get-Item $outputZip
Write-Host "SUCCESS! Archive created at: $outputZip"
Write-Host "Size: $([math]::Round($zipInfo.Length / 1MB, 2)) MB ($($zipInfo.Length) bytes)"
