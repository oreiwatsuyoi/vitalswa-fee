export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Allow GET for testing
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'AI Test endpoint is working',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
    });
  }

  if (req.method === 'POST') {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Say hello in a friendly way"
            }]
          }]
        })
      });

      const data = await response.json();
      
      return res.status(200).json({
        success: true,
        geminiResponse: data,
        statusCode: response.status
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        hasApiKey: !!process.env.GEMINI_API_KEY
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}