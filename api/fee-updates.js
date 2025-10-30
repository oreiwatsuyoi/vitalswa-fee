// Real-time fee updates endpoint
export default async function handler(req, res) {
  console.log('🔄 Fee updates API called:', req.method);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    console.log('📊 Generating fee updates...');
    // Get latest fee updates
    const updates = {
      lastUpdated: new Date().toISOString(),
      changes: [
        {
          service: 'Freedom Virtual Card',
          field: 'Transaction Fee',
          oldValue: '1.5%',
          newValue: '1.3%',
          effectiveDate: new Date(Date.now() + 24*60*60*1000).toISOString()
        }
      ],
      version: '2.1.0'
    };
    
    console.log('✅ Fee updates sent:', updates);
    return res.status(200).json(updates);
  }

  if (req.method === 'POST') {
    // Subscribe to fee updates
    const { email, services } = req.body;
    
    // Store subscription (would integrate with database)
    console.log('Fee update subscription:', { email, services });
    
    return res.status(200).json({
      success: true,
      message: 'Subscribed to fee updates',
      services: services || ['all']
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}