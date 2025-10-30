# SecureBank Agent Dashboard Setup Guide

## 🏦 Complete Agent Management System

This guide will help you set up the professional agent dashboard with AI integration, multi-agent support, and comprehensive session management.

## 📋 Prerequisites

### Required Services
1. **Firebase Project** with Realtime Database
2. **Google Gemini API Key** for AI assistant
3. **Modern Web Browser** (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
4. **HTTPS Domain** (required for WebRTC)

### Optional Services
- **Email Service** (for sending codes to customers)
- **SMS Service** (for mobile notifications)
- **Analytics Platform** (for usage tracking)

## 🚀 Quick Setup

### Step 1: Firebase Configuration

1. **Create Firebase Project**
   ```bash
   # Go to https://console.firebase.google.com
   # Click "Create a project"
   # Enable Realtime Database
   ```

2. **Configure Database Rules**
   ```json
   {
     "rules": {
       "agents": {
         ".read": true,
         ".write": true
       },
       "sessions": {
         ".read": true,
         ".write": true
       },
       "access-codes": {
         ".read": true,
         ".write": true
       },
       "rooms": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

3. **Get Firebase Configuration**
   - Go to Project Settings → General
   - Scroll to "Your apps" section
   - Copy the Firebase configuration object

### Step 2: Gemini AI Setup

1. **Get Gemini API Key**
   ```bash
   # Go to https://makersuite.google.com/app/apikey
   # Click "Create API Key"
   # Copy the generated key
   ```

2. **Test API Access**
   ```bash
   curl -H 'Content-Type: application/json' \
        -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
        -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY'
   ```

### Step 3: Configuration

1. **Copy Configuration File**
   ```bash
   cp public/config.sample.js public/config.js
   ```

2. **Update Configuration**
   ```javascript
   // public/config.js
   const firebaseConfig = {
     apiKey: "your-actual-api-key",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456789012345"
   };

   const aiConfig = {
     geminiApiKey: "your-actual-gemini-api-key",
     // ... other AI settings
   };
   ```

### Step 4: Deploy

1. **Local Development**
   ```bash
   # Start local server
   python -m http.server 3000 --directory public
   # Or use Node.js
   npx http-server public -p 3000
   ```

2. **Production Deployment**
   ```bash
   # Deploy to Vercel
   vercel --prod
   
   # Or deploy to Netlify
   netlify deploy --prod --dir=public
   ```

## 🎯 Agent Dashboard Features

### 📊 Dashboard Overview
- **Real-time Statistics**: Active sessions, generated codes, customer satisfaction
- **Performance Metrics**: Average session duration, connection quality
- **Activity Feed**: Recent actions and notifications

### 🔐 Access Code Management
- **Generate Codes**: Create secure 6-digit alphanumeric codes
- **QR Code Generation**: Instant QR codes for mobile access
- **Link Sharing**: Direct customer links with embedded codes
- **Email Integration**: Send codes directly to customers
- **Expiry Management**: Automatic code expiration (30 minutes default)

### 👥 Multi-Agent Support
- **Team Status**: View all online agents and their availability
- **Session Distribution**: Load balancing across agents
- **Collaborative Features**: Agent-to-agent communication
- **Presence System**: Real-time online/offline status

### 🤖 AI Assistant Integration
- **Gemini AI**: Powered by Google's advanced language model
- **Banking Expertise**: Trained responses for financial queries
- **Real-time Help**: Instant answers to customer questions
- **Context Awareness**: Understands banking terminology and processes

### 📱 Session Management
- **Active Monitoring**: Real-time session tracking
- **Quality Metrics**: Connection quality and performance data
- **Customer Information**: Session details and interaction history
- **Session Controls**: Join, monitor, and manage customer sessions

## 🔧 Advanced Configuration

### Custom Agent Profiles
```javascript
// Add to config.js
const customAgents = [
  {
    name: "Your Name",
    title: "Your Title",
    avatar: "YN", // Your initials
    rating: 4.9,
    specializations: ["Your", "Specializations"],
    quote: "Your professional quote",
    languages: ["English", "Other Languages"]
  }
];
```

### Email Integration
```javascript
// Example email service integration
async function sendEmailWithCode(email, name, code, message) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject: 'Your SecureBank Access Code',
      template: 'access-code',
      data: { name, code, message, agentName: currentAgent.name }
    })
  });
  
  return response.ok;
}
```

### Custom Notifications
```javascript
// Add custom notification types
function addCustomNotification(type, title, message) {
  const notification = {
    id: Date.now(),
    type: type, // 'success', 'error', 'warning', 'info', 'custom'
    title: title,
    message: message,
    timestamp: new Date(),
    actions: [
      { label: 'View Details', action: 'showDetails' },
      { label: 'Dismiss', action: 'dismiss' }
    ]
  };
  
  notifications.unshift(notification);
  updateNotificationsList();
}
```

## 📱 Mobile Optimization

### Responsive Design
- **Breakpoints**: Mobile (≤768px), Tablet (769-1024px), Desktop (≥1025px)
- **Touch Controls**: Optimized for mobile interaction
- **Adaptive Layout**: Sidebar collapses on smaller screens
- **Performance**: Optimized for mobile networks

### PWA Features (Optional)
```javascript
// Add to index.html for PWA support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 🔒 Security Best Practices

### Access Code Security
- **Random Generation**: Cryptographically secure random codes
- **Expiry Times**: Automatic expiration (configurable)
- **Usage Tracking**: Monitor code usage and abuse
- **IP Logging**: Track access attempts for security

### Session Security
- **End-to-End Encryption**: WebRTC provides encrypted communication
- **Session Isolation**: Each session is completely isolated
- **Audit Logging**: Complete session audit trails
- **Data Protection**: No video/audio data stored on servers

### Firebase Security Rules
```json
{
  "rules": {
    "agents": {
      "$agentId": {
        ".read": "auth != null && auth.uid == $agentId",
        ".write": "auth != null && auth.uid == $agentId"
      }
    },
    "sessions": {
      "$sessionId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## 📊 Analytics and Monitoring

### Built-in Metrics
- **Session Duration**: Average and individual session times
- **Connection Quality**: Real-time quality monitoring
- **Customer Satisfaction**: Post-session feedback scores
- **Agent Performance**: Individual agent statistics

### Custom Analytics
```javascript
// Example Google Analytics integration
function trackEvent(category, action, label, value) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}

// Track code generation
trackEvent('Agent', 'generate_code', currentAgent.id);

// Track session start
trackEvent('Session', 'start', sessionId, duration);
```

## 🚀 Performance Optimization

### Loading Performance
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Separate bundles for different features
- **CDN Usage**: External libraries from CDN
- **Caching**: Aggressive caching for static assets

### Runtime Performance
- **Memory Management**: Automatic cleanup of resources
- **Connection Pooling**: Efficient WebRTC connection management
- **Background Processing**: Non-blocking operations
- **Error Recovery**: Graceful error handling and recovery

## 🔧 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   ```javascript
   // Check Firebase configuration
   console.log('Firebase config:', firebaseConfig);
   
   // Test database connection
   database.ref('.info/connected').on('value', (snapshot) => {
     console.log('Connected to Firebase:', snapshot.val());
   });
   ```

2. **Gemini AI Not Working**
   ```javascript
   // Verify API key
   console.log('Gemini API Key:', GEMINI_API_KEY.substring(0, 10) + '...');
   
   // Test API connection
   fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       contents: [{ parts: [{ text: 'Hello' }] }]
     })
   }).then(response => console.log('API Status:', response.status));
   ```

3. **WebRTC Connection Issues**
   ```javascript
   // Check HTTPS requirement
   console.log('Protocol:', window.location.protocol);
   
   // Test getUserMedia
   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
     .then(stream => console.log('Media access granted'))
     .catch(error => console.error('Media access denied:', error));
   ```

### Debug Mode
```javascript
// Enable debug mode in config.js
const appConfig = {
  debug: true, // Enable detailed logging
  // ... other settings
};

// Debug logging will appear in browser console
```

## 📞 Support and Documentation

### Getting Help
- **Documentation**: Complete inline documentation
- **Error Handling**: Detailed error messages and recovery suggestions
- **Console Logging**: Comprehensive logging for debugging
- **Community Support**: GitHub issues and discussions

### Professional Support
- **Implementation Services**: Custom setup and configuration
- **Training Programs**: Agent training and onboarding
- **Technical Support**: 24/7 technical assistance
- **Custom Development**: Feature customization and extensions

## 🎉 Go Live Checklist

### Pre-Launch
- [ ] Firebase project configured and tested
- [ ] Gemini API key working and tested
- [ ] All configuration files updated
- [ ] HTTPS certificate installed
- [ ] Security rules configured
- [ ] Agent profiles created
- [ ] Test sessions completed

### Launch Day
- [ ] Monitor system performance
- [ ] Check agent availability
- [ ] Verify code generation working
- [ ] Test customer access flow
- [ ] Monitor error logs
- [ ] Backup configuration files

### Post-Launch
- [ ] Collect agent feedback
- [ ] Monitor customer satisfaction
- [ ] Analyze usage patterns
- [ ] Plan feature enhancements
- [ ] Schedule regular maintenance

---

**SecureBank Agent Dashboard** - Empowering agents with professional tools for exceptional customer service.