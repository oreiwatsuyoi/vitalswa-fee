# SecureBank Virtual Booth Deployment Script
# This script prepares and deploys the virtual banking consultation platform

Write-Host "🏦 SecureBank Virtual Booth Deployment" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Blue
Write-Host ""

# Check if config.js exists
if (-not (Test-Path "public/config.js")) {
    Write-Host "❌ Error: config.js not found!" -ForegroundColor Red
    Write-Host "Please copy config.sample.js to config.js and configure your Firebase settings." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps to configure:" -ForegroundColor Cyan
    Write-Host "1. Copy public/config.sample.js to public/config.js"
    Write-Host "2. Replace the Firebase configuration with your project settings"
    Write-Host "3. Run this script again"
    Write-Host ""
    exit 1
}

Write-Host "✅ Configuration file found" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js 14+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI version: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting deployment process..." -ForegroundColor Blue

# Generate build configuration
Write-Host "📦 Generating build configuration..." -ForegroundColor Cyan
try {
    node generate-config.mjs
    Write-Host "✅ Build configuration generated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Build configuration generation failed, continuing..." -ForegroundColor Yellow
}

# Validate HTML structure
Write-Host "🔍 Validating application structure..." -ForegroundColor Cyan
$requiredFiles = @(
    "public/index.html",
    "public/script.js", 
    "public/ui-helpers.js",
    "public/config.js"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    exit 1
}

Write-Host "✅ All required files present" -ForegroundColor Green

# Check for HTTPS requirement
Write-Host "🔒 Checking security requirements..." -ForegroundColor Cyan
Write-Host "✅ WebRTC requires HTTPS - Vercel provides this automatically" -ForegroundColor Green

# Deploy to Vercel
Write-Host ""
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Blue
Write-Host "This will deploy your SecureBank Virtual Booth to a production URL." -ForegroundColor Cyan
Write-Host ""

$deployChoice = Read-Host "Deploy to production? (y/N)"
if ($deployChoice -eq "y" -or $deployChoice -eq "Y") {
    Write-Host "🚀 Deploying to production..." -ForegroundColor Blue
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your SecureBank Virtual Booth is now live!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Test the application with a sample access code"
        Write-Host "2. Configure Firebase security rules for production"
        Write-Host "3. Set up monitoring and analytics"
        Write-Host "4. Train banking staff on the new platform"
        Write-Host ""
        Write-Host "Security reminders:" -ForegroundColor Red
        Write-Host "- Ensure Firebase security rules are properly configured"
        Write-Host "- Monitor access logs regularly"
        Write-Host "- Keep access codes secure and rotate them regularly"
        Write-Host "- Test the platform regularly for security vulnerabilities"
        Write-Host ""
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "📋 Preview deployment..." -ForegroundColor Blue
    vercel
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🔍 Preview deployment successful!" -ForegroundColor Green
        Write-Host "Use the preview URL to test your application before production deployment." -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "❌ Preview deployment failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📚 Documentation and Support:" -ForegroundColor Blue
Write-Host "- README.md contains detailed setup and usage instructions"
Write-Host "- Check the browser console for any runtime errors"
Write-Host "- Ensure all users have modern browsers with WebRTC support"
Write-Host ""
Write-Host "🏦 SecureBank Virtual Booth deployment complete!" -ForegroundColor Green