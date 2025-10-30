export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAK2n-ZUqMXgsIpyJ5m6iXjPX-kNlPqvwY",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "webrtc-a141d.firebaseapp.com",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "https://webrtc-a141d-default-rtdb.firebaseio.com/",
    projectId: process.env.FIREBASE_PROJECT_ID || "webrtc-a141d",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "webrtc-a141d.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "207832483278",
    appId: process.env.FIREBASE_APP_ID || "1:207832483278:web:de9faaf17137d1380d579f"
  };

  res.status(200).json(config);
}