import webpush from 'web-push';
import { db } from '../../lib/firebase.js';

// Configure VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@vitalswap.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  console.log('📤 Push send API called:', req.method);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { message } = req.body;
    console.log('🔔 Sending push notification:', message);
    
    try {
      // Get all active subscriptions from Firestore
      const snapshot = await db.collection('pushSubscriptions').where('active', '==', true).get();
      const subscriptions = snapshot.docs.map(doc => doc.data());
      
      console.log('📊 Found', subscriptions.length, 'subscriptions in Firestore');
      
      if (subscriptions.length === 0) {
        return res.status(200).json({ sent: false, message: 'No subscribers found' });
      }
      
      // Send to all stored subscriptions
      const promises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(subscription, message);
          console.log('✅ Sent to subscriber');
        } catch (error) {
          console.error('❌ Failed to send to subscriber:', error.message);
        }
      });
      
      await Promise.all(promises);
      console.log('✅ Push notifications sent to', subscriptions.length, 'subscribers');
      
      return res.status(200).json({ sent: true, message, subscribers: subscriptions.length });
    } catch (error) {
      console.error('❌ Push send failed:', error);
      return res.status(500).json({ error: 'Push send failed: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}