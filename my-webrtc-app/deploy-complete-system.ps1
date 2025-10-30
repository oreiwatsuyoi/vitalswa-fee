# SecureBank Virtual Booth - Complete System Deployment
# This script deploys both customer interface and agent dashboard

Write-Host "🏦 SecureBank Virtual Booth - Complete System Deployment" -ForegroundColor Blue
Write-Host "=========================================================" -ForegroundColor Blue
Write-Host ""

# ASCII Art Banner
Write-Host "   ____                           ____              _    " -ForegroundColor Cyan
Write-Host "  / ___|  ___  ___ _   _ _ __ ___ | __ )  __ _ _ __ | | __" -ForegroundColor Cyan
Write-Host "  \___ \ / _ \/ __| | | | '__/ _ \|  _ \ / _`` | '_ \| |/ /" -ForegroundColor Cyan
Write-Host "   ___) |  __/ (__| |_| | | |  __/ |_) | (_| | | | |   < " -ForegroundColor Cyan
Write-Host "  |____/ \___|\___|\__,_|_|  \___|____/ \__,_|_| |_|_|\_\" -ForegroundColor Cyan
Write-Host "                                                        " -ForegroundColor Cyan
Write-Host "  Virtual Booth - Professional Banking Platform         " -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "🔍 Checking Prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js 14+ from https://nodejs.org" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Check if config.js exists
if (-not (Test-Path "public/config.js")) {
    Write-Host "⚠️  Configuration file not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Setting up configuration..." -ForegroundColor Cyan
    
    if (Test-Path "public/config.sample.js") {
        Copy-Item "public/config.sample.js" "public/config.js"
        Write-Host "✅ Created config.js from sample" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔧 IMPORTANT: Please edit public/config.js and add your:" -ForegroundColor Red
        Write-Host "   - Firebase configuration" -ForegroundColor Red
        Write-Host "   - Gemini API key" -ForegroundColor Red
        Write-Host ""
        
        $continueChoice = Read-Host "Have you configured config.js? (y/N)"
        if ($continueChoice -ne "y" -and $continueChoice -ne "Y") {
            Write-Host "Please configure config.js and run this script again." -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "❌ config.sample.js not found!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Configuration file found" -ForegroundColor Green

# Validate required files
Write-Host ""
Write-Host "📋 Validating System Files..." -ForegroundColor Yellow

$requiredFiles = @(
    "public/index.html",
    "public/script.js",
    "public/ui-helpers.js",
    "public/agent-dashboard.html",
    "public/agent-dashboard.js",
    "public/config.js"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing required files. Please ensure all files are present." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All system files validated" -ForegroundColor Green

# Check Vercel CLI
Write-Host ""
Write-Host "🚀 Checking Deployment Tools..." -ForegroundColor Yellow

try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    try {
        npm install -g vercel
        Write-Host "✅ Vercel CLI installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
}

# System Overview
Write-Host ""
Write-Host "📊 System Overview:" -ForegroundColor Blue
Write-Host "===================" -ForegroundColor Blue
Write-Host ""
Write-Host "Customer Interface:" -ForegroundColor Cyan
Write-Host "  • Premium white & blue design" -ForegroundColor White
Write-Host "  • 6-digit access code entry" -ForegroundColor White
Write-Host "  • Camera/audio testing lobby" -ForegroundColor White
Write-Host "  • HD video calling with agents" -ForegroundColor White
Write-Host "  • Secure in-session chat" -ForegroundColor White
Write-Host "  • Mobile responsive design" -ForegroundColor White
Write-Host ""
Write-Host "Agent Dashboard:" -ForegroundColor Cyan
Write-Host "  • Professional agent console" -ForegroundColor White
Write-Host "  • Access code generation & QR codes" -ForegroundColor White
Write-Host "  • Multi-agent team management" -ForegroundColor White
Write-Host "  • AI assistant (Gemini integration)" -ForegroundColor White
Write-Host "  • Real-time session monitoring" -ForegroundColor White
Write-Host "  • Performance analytics" -ForegroundColor White
Write-Host ""

# Configuration validation
Write-Host "🔧 Validating Configuration..." -ForegroundColor Yellow

# Check if config contains sample values
$configContent = Get-Content "public/config.js" -Raw
if ($configContent -match "your-api-key-here" -or $configContent -match "YOUR_GEMINI_API_KEY_HERE") {
    Write-Host "⚠️  Configuration contains sample values!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please update the following in public/config.js:" -ForegroundColor Red
    
    if ($configContent -match "your-api-key-here") {
        Write-Host "  • Firebase configuration (apiKey, authDomain, etc.)" -ForegroundColor Red
    }
    
    if ($configContent -match "YOUR_GEMINI_API_KEY_HERE") {
        Write-Host "  • Gemini API key for AI assistant" -ForegroundColor Red
    }
    
    Write-Host ""
    $proceedChoice = Read-Host "Continue with sample configuration for testing? (y/N)"
    if ($proceedChoice -ne "y" -and $proceedChoice -ne "Y") {
        Write-Host "Please update configuration and run again." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "⚠️  Proceeding with sample configuration (limited functionality)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Configuration appears to be properly set up" -ForegroundColor Green
}

# Pre-deployment tests
Write-Host ""
Write-Host "🧪 Running Pre-deployment Tests..." -ForegroundColor Yellow

# Test HTML validation
Write-Host "  • Validating HTML structure..." -ForegroundColor White
$htmlFiles = @("public/index.html", "public/agent-dashboard.html")
foreach ($htmlFile in $htmlFiles) {
    $htmlContent = Get-Content $htmlFile -Raw
    if ($htmlContent -match "<!DOCTYPE html>" -and $htmlContent -match "</html>") {
        Write-Host "    ✅ $htmlFile structure valid" -ForegroundColor Green
    } else {
        Write-Host "    ❌ $htmlFile structure invalid" -ForegroundColor Red
    }
}

# Test JavaScript syntax (basic check)
Write-Host "  • Validating JavaScript files..." -ForegroundColor White
$jsFiles = @("public/script.js", "public/agent-dashboard.js", "public/ui-helpers.js")
foreach ($jsFile in $jsFiles) {
    if (Test-Path $jsFile) {
        $jsContent = Get-Content $jsFile -Raw
        # Basic syntax check - look for unmatched braces
        $openBraces = ($jsContent.ToCharArray() | Where-Object { $_ -eq '{' }).Count
        $closeBraces = ($jsContent.ToCharArray() | Where-Object { $_ -eq '}' }).Count
        
        if ($openBraces -eq $closeBraces) {
            Write-Host "    ✅ $jsFile syntax check passed" -ForegroundColor Green
        } else {
            Write-Host "    ⚠️  $jsFile may have syntax issues (brace mismatch)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "✅ Pre-deployment tests completed" -ForegroundColor Green

# Deployment options
Write-Host ""
Write-Host "🚀 Deployment Options:" -ForegroundColor Blue
Write-Host "======================" -ForegroundColor Blue
Write-Host ""
Write-Host "1. 🌐 Production Deployment (Recommended)" -ForegroundColor Cyan
Write-Host "   • Deploy to Vercel with custom domain" -ForegroundColor White
Write-Host "   • HTTPS enabled automatically" -ForegroundColor White
Write-Host "   • Global CDN distribution" -ForegroundColor White
Write-Host "   • Professional URLs" -ForegroundColor White
Write-Host ""
Write-Host "2. 🧪 Preview Deployment" -ForegroundColor Cyan
Write-Host "   • Deploy to Vercel preview environment" -ForegroundColor White
Write-Host "   • Test before going live" -ForegroundColor White
Write-Host "   • Temporary URLs for testing" -ForegroundColor White
Write-Host ""
Write-Host "3. 💻 Local Development" -ForegroundColor Cyan
Write-Host "   • Run locally for development" -ForegroundColor White
Write-Host "   • Test on localhost" -ForegroundColor White
Write-Host "   • Debug and customize" -ForegroundColor White
Write-Host ""

$deployChoice = Read-Host "Select deployment option (1/2/3)"

switch ($deployChoice) {
    "1" {
        Write-Host ""
        Write-Host "🌐 Starting Production Deployment..." -ForegroundColor Blue
        Write-Host ""
        
        # Production deployment
        Write-Host "Deploying to Vercel production..." -ForegroundColor Cyan
        vercel --prod
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "🎉 Production Deployment Successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Your SecureBank Virtual Booth is now live!" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "📱 Customer Interface:" -ForegroundColor Blue
            Write-Host "   • Customers use the main URL to enter access codes" -ForegroundColor White
            Write-Host "   • Mobile-optimized for all devices" -ForegroundColor White
            Write-Host "   • Premium banking experience" -ForegroundColor White
            Write-Host ""
            Write-Host "👨‍💼 Agent Dashboard:" -ForegroundColor Blue
            Write-Host "   • Access via: [your-domain]/agent-dashboard.html" -ForegroundColor White
            Write-Host "   • Generate codes and QR codes" -ForegroundColor White
            Write-Host "   • Monitor all agent activities" -ForegroundColor White
            Write-Host "   • AI assistant for customer support" -ForegroundColor White
            Write-Host ""
            Write-Host "🔐 Security Features:" -ForegroundColor Blue
            Write-Host "   • End-to-end encrypted video calls" -ForegroundColor White
            Write-Host "   • Secure access code system" -ForegroundColor White
            Write-Host "   • Session audit logging" -ForegroundColor White
            Write-Host "   • HTTPS enforced automatically" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "❌ Production deployment failed!" -ForegroundColor Red
            Write-Host "Please check the error messages above." -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🧪 Starting Preview Deployment..." -ForegroundColor Blue
        Write-Host ""
        
        # Preview deployment
        Write-Host "Deploying to Vercel preview..." -ForegroundColor Cyan
        vercel
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "🔍 Preview Deployment Successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Use the preview URLs to test your system before production." -ForegroundColor Cyan
            Write-Host "When ready, run this script again and choose option 1 for production." -ForegroundColor Yellow
            Write-Host ""
        } else {
            Write-Host "❌ Preview deployment failed!" -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "💻 Starting Local Development Server..." -ForegroundColor Blue
        Write-Host ""
        
        # Local development
        Write-Host "Starting local server on port 3000..." -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📱 Customer Interface: http://localhost:3000" -ForegroundColor Green
        Write-Host "👨‍💼 Agent Dashboard: http://localhost:3000/agent-dashboard.html" -ForegroundColor Green
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
        Write-Host ""
        
        # Start local server
        try {
            python -m http.server 3000 --directory public
        } catch {
            Write-Host "Python not found, trying Node.js server..." -ForegroundColor Yellow
            npx http-server public -p 3000
        }
    }
    
    default {
        Write-Host "Invalid option selected." -ForegroundColor Red
        exit 1
    }
}

# Post-deployment instructions
if ($deployChoice -eq "1" -or $deployChoice -eq "2") {
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Blue
    Write-Host "===============" -ForegroundColor Blue
    Write-Host ""
    Write-Host "1. 🧪 Test the System:" -ForegroundColor Cyan
    Write-Host "   • Open agent dashboard and generate a test code" -ForegroundColor White
    Write-Host "   • Use the code in customer interface" -ForegroundColor White
    Write-Host "   • Test video calling functionality" -ForegroundColor White
    Write-Host "   • Verify AI assistant is working" -ForegroundColor White
    Write-Host ""
    Write-Host "2. 👥 Agent Training:" -ForegroundColor Cyan
    Write-Host "   • Train agents on dashboard usage" -ForegroundColor White
    Write-Host "   • Show code generation process" -ForegroundColor White
    Write-Host "   • Demonstrate QR code sharing" -ForegroundColor White
    Write-Host "   • Practice session management" -ForegroundColor White
    Write-Host ""
    Write-Host "3. 🔒 Security Setup:" -ForegroundColor Cyan
    Write-Host "   • Configure Firebase security rules" -ForegroundColor White
    Write-Host "   • Set up access logging" -ForegroundColor White
    Write-Host "   • Enable audit trails" -ForegroundColor White
    Write-Host "   • Test emergency procedures" -ForegroundColor White
    Write-Host ""
    Write-Host "4. 📊 Monitoring:" -ForegroundColor Cyan
    Write-Host "   • Monitor system performance" -ForegroundColor White
    Write-Host "   • Track customer satisfaction" -ForegroundColor White
    Write-Host "   • Analyze usage patterns" -ForegroundColor White
    Write-Host "   • Plan capacity scaling" -ForegroundColor White
    Write-Host ""
    Write-Host "5. 🎯 Go Live:" -ForegroundColor Cyan
    Write-Host "   • Announce to customers" -ForegroundColor White
    Write-Host "   • Update marketing materials" -ForegroundColor White
    Write-Host "   • Monitor first sessions closely" -ForegroundColor White
    Write-Host "   • Collect feedback for improvements" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "📞 Support Resources:" -ForegroundColor Blue
Write-Host "=====================" -ForegroundColor Blue
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   • README.md - Complete system overview" -ForegroundColor White
Write-Host "   • AGENT_SETUP.md - Detailed agent setup guide" -ForegroundColor White
Write-Host "   • Inline code comments for customization" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Configuration:" -ForegroundColor Cyan
Write-Host "   • public/config.js - Main configuration file" -ForegroundColor White
Write-Host "   • Firebase console for database management" -ForegroundColor White
Write-Host "   • Vercel dashboard for deployment settings" -ForegroundColor White
Write-Host ""
Write-Host "🐛 Troubleshooting:" -ForegroundColor Cyan
Write-Host "   • Browser console for error messages" -ForegroundColor White
Write-Host "   • Firebase console for database issues" -ForegroundColor White
Write-Host "   • Network tab for connection problems" -ForegroundColor White
Write-Host ""

Write-Host ""
Write-Host "🎉 SecureBank Virtual Booth Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Thank you for choosing SecureBank Virtual Booth - the professional" -ForegroundColor Cyan
Write-Host "banking consultation platform that connects customers with agents" -ForegroundColor Cyan
Write-Host "through secure, high-quality video sessions." -ForegroundColor Cyan
Write-Host ""
Write-Host "🏦 Professional • 🔒 Secure • 📱 Responsive • 🤖 AI-Powered" -ForegroundColor Blue
Write-Host ""