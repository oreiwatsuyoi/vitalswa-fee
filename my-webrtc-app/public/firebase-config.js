// Firebase Configuration for VitalSwap Virtual Booth
// This file should be loaded before script.js

// Firebase Configuration - loaded from API
let dynamicFirebaseConfig = null;

// Load Firebase config from API
async function loadFirebaseConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            dynamicFirebaseConfig = await response.json();
            console.log('✅ Firebase config loaded from API');
            return dynamicFirebaseConfig;
        } else {
            throw new Error('Failed to load config');
        }
    } catch (error) {
        console.error('❌ Failed to load Firebase config:', error);
        // Fallback to static config if available
        if (typeof firebaseConfig !== 'undefined') {
            dynamicFirebaseConfig = firebaseConfig;
            console.log('🔄 Using fallback static Firebase config');
            return dynamicFirebaseConfig;
        }
        return null;
    }
}

// Initialize config loading
loadFirebaseConfig();