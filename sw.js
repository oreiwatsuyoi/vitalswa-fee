// VitalSwap Service Worker - Main Fee Page
// Standalone service worker for fee page

// Additional caching for fee page specific resources
const FEE_CACHE = 'vitalswap-fee-v1.0.0';
const FEE_STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event for fee page
self.addEventListener('install', (event) => {
  console.log('📦 Fee page service worker installing...');
  
  event.waitUntil(
    caches.open(FEE_CACHE)
      .then((cache) => {
        console.log('📦 Caching fee page assets');
        return cache.addAll(FEE_STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Fee page assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Fee page service worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('vitalswap-fee-') && cacheName !== FEE_CACHE) {
              console.log('🗑️ Deleting old fee cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Fee page service worker activated');
        return self.clients.claim();
      })
  );
});

console.log('🎯 VitalSwap Fee Page Service Worker loaded');