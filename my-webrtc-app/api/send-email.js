const nodemailer = require('nodemailer');

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

  const { to, name, code, message, agentName } = req.body;

  if (!to || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const customerLink = `${req.headers.host}?code=${code}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #003d82, #0066cc); padding: 40px 20px; text-align: center; }
          .logo { color: white; font-size: 28px; font-weight: 700; margin-bottom: 10px; }
          .subtitle { color: rgba(255,255,255,0.9); font-size: 16px; }
          .content { padding: 40px 30px; }
          .access-code { background: #e6f2ff; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
          .code { font-size: 36px; font-weight: 700; color: #003d82; letter-spacing: 8px; font-family: monospace; }
          .btn { display: inline-block; background: linear-gradient(135deg, #003d82, #0066cc); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f5f7fa; padding: 30px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VitalSwap</div>
            <div class="subtitle">Virtual Banking Consultation</div>
          </div>
          <div class="content">
            <h2 style="color: #003d82; margin-bottom: 20px;">Your Banking Session is Ready</h2>
            <p>Dear ${name || 'Valued Customer'},</p>
            <p>Your personal banking specialist <strong>${agentName || 'Banking Agent'}</strong> has scheduled a secure video consultation with you.</p>
            
            ${message ? `<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #003d82;"><strong>Personal Message:</strong><br>${message}</div>` : ''}
            
            <div class="access-code">
              <p style="margin-bottom: 10px; color: #666;">Your Access Code:</p>
              <div class="code">${code}</div>
              <p style="margin-top: 15px; color: #666; font-size: 14px;">Valid for 30 minutes</p>
            </div>
            
            <div style="text-align: center;">
              <a href="https://${customerLink}" class="btn">Join Banking Session</a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Security Notice:</strong> This session uses 256-bit encryption for your privacy and security.
            </p>
          </div>
          <div class="footer">
            <p><strong>VitalSwap Virtual Booth</strong></p>
            <p>Professional Banking Consultations</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"VitalSwap Virtual Booth" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Your VitalSwap Virtual Consultation - Access Code: ${code}`,
      html: emailHtml
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      recipient: to 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}