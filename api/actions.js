// Floating action menu backend endpoints
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, data } = req.body;

  switch (action) {
    case 'save-favorites':
      return res.json({ 
        success: true, 
        message: 'Favorites saved successfully',
        favorites: data?.services || []
      });

    case 'share-comparison':
      return res.json({ 
        success: true, 
        shareUrl: `https://vitalswap.com/fees?shared=${Date.now()}`,
        message: 'Fee comparison shared'
      });

    case 'download-guide':
      return res.json({ 
        success: true, 
        downloadUrl: '/assets/vitalswap-fee-guide.pdf',
        message: 'Fee guide download started'
      });

    case 'quick-calculate':
      const { service, amount } = data;
      const fee = calculateQuickFee(service, amount);
      return res.json({ 
        success: true, 
        calculation: { service, amount, fee, total: amount + fee }
      });

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

function calculateQuickFee(service, amount) {
  const feeRates = {
    'card': 0.015, // 1.5%
    'transfer': 0.02, // 2%
    'fx': 0.01, // 1%
    'payout': 10 // $10 flat
  };
  
  return service === 'payout' ? feeRates[service] : amount * (feeRates[service] || 0.02);
}