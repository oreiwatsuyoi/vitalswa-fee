function getStaticResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
    return 'VitalSwap offers transparent fees starting from 0.25%. All fees are displayed upfront with no hidden charges. You can use our fee calculator to see exact costs for any service.';
  }
  
  if (lowerMessage.includes('card') || lowerMessage.includes('virtual card')) {
    return 'Our Freedom Virtual Card costs $1 to create, $0.50 to fund, with 1.5% transaction fees and 1.5% FX fees outside the US.';
  }
  
  if (lowerMessage.includes('fx') || lowerMessage.includes('exchange') || lowerMessage.includes('trading')) {
    return 'FX trading is FREE to create offers. We add 10-15 points spread on market offers for competitive rates.';
  }
  
  if (lowerMessage.includes('business') || lowerMessage.includes('account')) {
    return 'Business accounts have the same core fees as customer accounts, plus additional settlement options and collections features.';
  }
  
  if (lowerMessage.includes('security') || lowerMessage.includes('safe')) {
    return 'VitalSwap is SOC 2 Type II certified with bank-grade security, multi-audited smart contracts, and comprehensive compliance.';
  }
  
  if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact')) {
    return 'You can reach our support team through the Virtual Booth for face-to-face assistance or use our contact form. We\'re here 24/7!';
  }
  
  return 'I can help you with VitalSwap fees, virtual cards, FX trading, business accounts, security, and support. What would you like to know more about?';
}

export default async function handler(req, res) {
  console.log('AI API called');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request received:', req.method, req.body);
    
    const { message, context } = req.body;

    if (!message) {
      console.log('No message provided');
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('No GEMINI_API_KEY found');
      return res.status(500).json({ 
        response: 'AI service is being configured. Please add your GEMINI_API_KEY to environment variables.'
      });
    }

    console.log('Importing GoogleGenerativeAI...');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    console.log('Creating AI instance...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // List available models
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
      const data = await response.json();
      console.log('Available models:', data.models?.map(m => m.name) || 'No models found');
    } catch (e) {
      console.log('Could not list models:', e.message);
    }
    
    // Try different models in order of preference (using available models from your API)
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];
    let response = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `You are a helpful AI assistant for VitalSwap, a transparent fee calculator and financial services platform.

Context: ${context || 'VitalSwap fee calculator and services'}

VITALSWAP COMPLETE FEE STRUCTURE:

**CUSTOMER ACCOUNTS:**

US Virtual Bank Account:
- Individual Account Issue: FREE
- ACH Deposit Fee: FREE
- Wire Deposit Fee: $15
- Fraud Reversal: $100
- 3rd Party Requiring Extra Diligence: 3%

NG Virtual Bank Account:
- NGN Wallet Funding: ₦200
- Fraud Reversal: ₦1,000
- 3rd Party Requiring Extra Diligence: 3%

Payout:
- NGN Payout - Instant: FREE
- USD Payout - 2-5 days: FREE
- USD Payout - 24hours: $10

Wallet to Wallet Transfer:
- NGN Individual → Individual: FREE
- NGN Individual → Business: 3%

Freedom Virtual Card:
- Create Card: $1
- Fund Card: $0.50
- Transaction Fee: 1.5% ($1 – $5)
- FX Fee (outside US): 1.5%
- Monthly Maintenance Fee: $1
- Defund Card: FREE
- Close Card: FREE

FX Trading:
- Create NGN Offer: FREE
- Buy NGN Offer: FREE (10–15 points spread)
- Create USD Offer: FREE
- Buy USD Offer: FREE (10–15 points spread)

**BUSINESS ACCOUNTS:**

US Virtual Bank Account:
- Business Account Issue: FREE
- ACH Deposit Fee: FREE
- Wire Deposit Fee: $15
- Fraud Reversal: $100
- 3rd Party Requiring Extra Diligence: 3%

NG Virtual Bank Account:
- NGN Wallet Funding: ₦200
- Fraud Reversal: ₦1,000
- 3rd Party Requiring Extra Diligence: 3%

Business Collections:
- NGN Settlement: ₦200 per transaction
- USD Settlement: 2% ($1–$2) - 2% capped at $2, Min $1

Business Payout:
- NGN Payout - Instant: FREE
- USD Payout - 2-5 days: FREE
- USD Payout - 24hours: $10

Wallet to Wallet Transfer:
- NGN Individual → Business: 2%

FX Trading:
- Create NGN Offer: FREE
- Buy NGN Offer: FREE (10 points spread)
- Create USD Offer: FREE
- Buy USD Offer: FREE (10 points spread)

ADDITIONAL SERVICES:
- Virtual Banking Booth: Face-to-face assistance with personal agents
- SOC 2 Type II certified security
- Multi-audited smart contracts
- 24/7 customer support

User question: ${message}

Please provide a helpful, accurate response using the exact fee information above. Be specific with amounts and always mention if something is FREE. Keep responses professional and helpful.`;

        console.log('Generating content...');
        const result = await model.generateContent(prompt);
        response = result.response.text();
        console.log(`Success with model: ${modelName}`);
        break;
      } catch (modelError) {
        console.log(`Model ${modelName} failed:`, modelError.message);
        continue;
      }
    }
    
    if (!response) {
      // Fallback to predefined responses
      response = getStaticResponse(message);
    }

    res.status(200).json({ response });
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      response: 'I\'m having trouble processing your request right now. Please try again in a moment or contact our support team for immediate assistance.',
      error: error.message
    });
  }
}