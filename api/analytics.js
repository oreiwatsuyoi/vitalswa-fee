// User behavior analytics endpoint
export default async function handler(req, res) {
  console.log('📊 Analytics API called:', req.method);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('✅ Analytics CORS preflight handled');
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // Track user interaction
    const { event, data, timestamp } = req.body;
    
    console.log('🖱️ Analytics event tracked:', { event, data, timestamp: timestamp || new Date().toISOString() });
    
    return res.status(200).json({ tracked: true });
  }

  if (req.method === 'GET') {
    // Get analytics insights
    const insights = {
      topCalculatedServices: [
        { service: 'Freedom Virtual Card', usage: 45.2 },
        { service: 'Wire Transfer', usage: 23.8 },
        { service: 'FX Trading', usage: 18.7 }
      ],
      conversionFunnel: {
        pageViews: 12847,
        calculatorUsage: 3421,
        serviceSelection: 1876,
        completedCalculations: 1234
      },
      heatmapData: {
        mostClickedElements: [
          { element: 'fee-calculator', clicks: 2341 },
          { element: 'virtual-card-info', clicks: 1876 },
          { element: 'ai-chat-button', clicks: 987 }
        ]
      },
      recommendations: [
        'Move fee calculator higher on page (+15% engagement)',
        'Add more prominent CTA buttons (+8% conversion)',
        'Simplify service selection flow (+12% completion)'
      ]
    };
    
    return res.status(200).json(insights);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}