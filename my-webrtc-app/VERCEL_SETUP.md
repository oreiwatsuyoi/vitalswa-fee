# Vercel Environment Setup Guide

## 🔑 Setting up Environment Variables in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to your Vercel project dashboard**
   - Visit https://vercel.com/dashboard
   - Select your SecureBank project

2. **Navigate to Settings**
   - Click on "Settings" tab
   - Go to "Environment Variables" section

3. **Add Environment Variables**
   - `GEMINI_API_KEY`: Your actual Gemini API key
   - `EMAIL_USER`: Your Gmail address (e.g., yourbank@gmail.com)
   - `EMAIL_PASS`: Your Gmail app password (not regular password)
   - Environment: Select "Production", "Preview", and "Development"
   - Click "Save" for each

4. **Redeploy your application**
   - Go to "Deployments" tab
   - Click "Redeploy" on your latest deployment

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variables
vercel env add GEMINI_API_KEY
vercel env add EMAIL_USER  
vercel env add EMAIL_PASS

# When prompted, enter your actual values
# Select all environments (Production, Preview, Development)

# Redeploy
vercel --prod
```

## 📧 Gmail Setup for Email Sending

### Enable App Passwords:
1. **Go to Google Account settings**
2. **Enable 2-Factor Authentication** (required)
3. **Generate App Password**:
   - Go to Security → App passwords
   - Select "Mail" and "Other"
   - Name it "SecureBank Virtual Booth"
   - Copy the 16-character password
4. **Use this app password** as `EMAIL_PASS` (not your regular Gmail password)

### Method 3: Using Vercel Secrets (Most Secure)

```bash
# Add as a secret (encrypted)
vercel secrets add gemini-api-key "your-actual-api-key-here"

# The vercel.json file already references this secret
# No additional configuration needed
```

## 🧪 Testing the Setup

1. **Deploy your application**
2. **Open the agent dashboard**
3. **Try the AI assistant feature**
4. **Check browser console for any API key errors**

## 🔧 Local Development

For local development, create a `.env.local` file:

```bash
# .env.local (add to .gitignore)
GEMINI_API_KEY=your-actual-api-key-here
```

## 🚀 Current Features

### Real Agent/Customer Flow:
1. **Agent generates access code** in dashboard
2. **Agent shares code** with customer (QR/link/email)
3. **Customer enters code** and validates against Firebase
4. **Agent can join same session** using "Join" button
5. **Both connect to same WebRTC room** for video call

### Demo Codes (for testing):
- `DEMO01` - Always works for testing
- `TEST01` - Always works for testing  
- `BANK01` - Always works for testing

### Agent Dashboard Access:
- **Button on customer page** for easy access
- **Direct URL**: `/agent-dashboard.html`

## 🎯 How It Works Now

1. **Agent Dashboard**: Generate codes, manage sessions, AI assistance
2. **Customer Interface**: Enter code, validate, connect to agent
3. **WebRTC Connection**: Both agent and customer join same room
4. **Real-time Communication**: Video, audio, and chat between agent and customer

The system now supports real agents and customers while maintaining demo functionality for testing.