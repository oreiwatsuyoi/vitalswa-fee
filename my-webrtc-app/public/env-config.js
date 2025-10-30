// Environment configuration for VitalSwap
// This file loads configuration from environment or provides fallbacks

window.envConfig = {
    // Firebase configuration will be loaded from API
    firebase: null,
    
    // API endpoints
    apiEndpoints: {
        config: '/api/config',
        sendEmail: '/api/send-email',
        aiChat: '/api/ai-chat'
    },
    
    // Demo access codes for testing
    demoCodes: ['DEMO01', 'TEST01', 'BANK01', 'VITAL1', 'SWAP01'],
    
    // Application settings
    app: {
        name: 'VitalSwap Virtual Booth',
        version: '1.0.0',
        maxSessionDuration: 3600000, // 1 hour in milliseconds
        sessionTimeout: 1800000, // 30 minutes in milliseconds
        maxConcurrentSessions: 5
    },
    
    // WebRTC configuration
    webrtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    },
    
    // Video quality settings
    video: {
        ideal: {
            width: 1280,
            height: 720,
            frameRate: 30
        },
        fallback: {
            width: 640,
            height: 480,
            frameRate: 15
        }
    },
    
    // Audio settings
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
};

// Load configuration on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Try to load Firebase config from API
        const response = await fetch(window.envConfig.apiEndpoints.config);
        if (response.ok) {
            const firebaseConfig = await response.json();
            window.envConfig.firebase = firebaseConfig;
            window.firebaseConfig = firebaseConfig; // For backward compatibility
            console.log('Firebase configuration loaded from API');
        } else {
            throw new Error('API config not available');
        }
    } catch (error) {
        console.log('Using fallback Firebase configuration');
        // Fallback configuration
        const fallbackConfig = {
            apiKey: "demo-api-key",
            authDomain: "vitalswap-demo.firebaseapp.com",
            databaseURL: "https://vitalswap-demo-default-rtdb.firebaseio.com/",
            projectId: "vitalswap-demo",
            storageBucket: "vitalswap-demo.appspot.com",
            messagingSenderId: "123456789012",
            appId: "1:123456789012:web:demo123456789"
        };
        
        window.envConfig.firebase = fallbackConfig;
        window.firebaseConfig = fallbackConfig; // For backward compatibility
    }
});

console.log('VitalSwap environment configuration loaded');