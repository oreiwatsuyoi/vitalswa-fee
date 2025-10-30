export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY environment variable not set');
    return res.status(500).json({ 
      error: 'Gemini API key not configured',
      success: false
    });
  }

  try {
    console.log('Making request to Gemini API...', {
      hasKey: !!process.env.GEMINI_API_KEY,
      keyLength: process.env.GEMINI_API_KEY?.length
    });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful AI assistant for VitalSwap banking customers and agents. Please provide professional, accurate, and helpful responses to banking-related queries. Keep responses concise and actionable. Query: ${query}`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      console.error('Unexpected Gemini API response:', data);
      // Check if there's a safety issue
      if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
        throw new Error('Content was blocked for safety reasons');
      }
      throw new Error('Invalid response from Gemini API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    res.status(200).json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('AI chat error:', error);
    
    // If Gemini API is blocked, provide fallback responses
    if (error.message.includes('PERMISSION_DENIED') || error.message.includes('API_KEY_SERVICE_BLOCKED')) {
      const fallbackResponse = generateFallbackResponse(query);
      return res.status(200).json({
        success: true,
        response: fallbackResponse + '\n\n*Note: This is a basic response. For detailed assistance, please connect with a live agent.*'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get AI response',
      details: error.message
    });
  }
}

function generateFallbackResponse(query) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('account') || lowerQuery.includes('balance')) {
    return 'I can help you with account information! You can check your balance, view transactions, and manage your account settings through our online banking portal or mobile app. For specific account details, please connect with one of our agents.';
  }
  
  if (lowerQuery.includes('loan') || lowerQuery.includes('mortgage')) {
    return 'We offer various loan options including personal loans, auto loans, and mortgages. Our current rates are competitive and we have flexible terms. I\'d recommend speaking with one of our loan specialists who can provide personalized options based on your needs.';
  }
  
  if (lowerQuery.includes('credit card') || lowerQuery.includes('card')) {
    return 'We have several credit card options with different rewards and benefits. Our cards offer cashback, travel rewards, and low interest rates. A banking agent can help you find the perfect card for your spending habits.';
  }
  
  if (lowerQuery.includes('hours') || lowerQuery.includes('open')) {
    return 'Our branches are typically open Monday-Friday 9AM-5PM, and Saturday 9AM-1PM. Online banking is available 24/7. For specific branch hours, please check our website or contact your local branch.';
  }
  
  if (lowerQuery.includes('fee') || lowerQuery.includes('charge')) {
    return 'We strive to keep fees transparent and competitive. Common fees may include overdraft, ATM, and wire transfer fees. Many fees can be waived with certain account types. Please speak with an agent for a complete fee schedule.';
  }
  
  if (lowerQuery.includes('investment') || lowerQuery.includes('savings')) {
    return 'We offer various investment and savings options including high-yield savings accounts, CDs, and investment portfolios. Our financial advisors can help you create a strategy that meets your goals.';
  }
  
  return 'Thank you for your question! I\'m here to help with general banking information. For detailed assistance with your specific needs, I recommend connecting with one of our experienced banking agents who can provide personalized support.';
}