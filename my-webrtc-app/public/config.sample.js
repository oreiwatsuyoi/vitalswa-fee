// Firebase Configuration for SecureBank Virtual Booth
// Copy this file to config.js and replace with your actual Firebase configuration

const firebaseConfig = {
  // Your Firebase project configuration
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com", 
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345"
};

// Application Configuration
const appConfig = {
  // Application settings
  appName: "SecureBank Virtual Booth",
  version: "1.0.0",
  
  // Session settings
  maxSessionDuration: 3600000, // 1 hour in milliseconds
  connectionTimeout: 30000,    // 30 seconds
  
  // Video settings
  defaultVideoConstraints: {
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    frameRate: { ideal: 30, min: 15 }
  },
  
  // Audio settings
  defaultAudioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  
  // UI settings
  theme: {
    primaryColor: "#003d82",
    secondaryColor: "#0066cc",
    accentColor: "#4d94ff"
  },
  
  // Feature flags
  features: {
    virtualBackground: true,
    screenSharing: true,
    chatEnabled: true,
    recordingEnabled: false,
    qualityMonitoring: true
  },
  
  // Security settings
  security: {
    accessCodeLength: 6,
    sessionEncryption: true,
    auditLogging: true
  }
};

// Export configurations
window.firebaseConfig = firebaseConfig;
window.appConfig = appConfig;