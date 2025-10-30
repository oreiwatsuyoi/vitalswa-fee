// Push notification subscription endpoint
import webpush from 'web-push';
import { db } from '../../lib/firebase.js';

// Configure VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@vitalswap.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  console.log('🔔 Push subscription API called:', req.method);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { subscription, sendWelcome } = req.body;
    console.log('📱 Push subscription received:', subscription);
    
    try {
      // Store subscription in Firestore
      const docRef = db.collection('pushSubscriptions').doc(subscription.endpoint.split('/').pop());
      await docRef.set({
        ...subscription,
        createdAt: new Date(),
        active: true
      });
      
      console.log('💾 Subscription stored in Firestore');
      
      // Send welcome notification immediately if requested
      if (sendWelcome) {
        try {
          await webpush.sendNotification(subscription, 'Team AlgoNauts welcomes You to VitalSwap\'s fee page');
          console.log('🎉 Welcome notification sent');
        } catch (error) {
          console.error('❌ Welcome notification failed:', error);
        }
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Firestore error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}