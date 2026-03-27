export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug environment variables
    const envVars = {
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL ? "SET" : "NOT SET",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET",
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? "SET" : "NOT SET",
      GA_PROPERTY_ID: process.env.GA_PROPERTY_ID || "NOT SET"
    };

    const privateKeys = process.env.GOOGLE_PRIVATE_KEY ? {
      length: process.env.GOOGLE_PRIVATE_KEY.length,
      startsWith: process.env.GOOGLE_PRIVATE_KEY.startsWith("-----BEGIN") ? "CORRECT" : "INCORRECT",
      endsWith: process.env.GOOGLE_PRIVATE_KEY.endsWith("KEY-----") ? "CORRECT" : "INCORRECT"
    } : null;

    return res.status(200).json({
      message: "Environment variables debug",
      envVars,
      privateKeys,
      allEnv: Object.keys(process.env).filter(key => key.startsWith('GOOGLE_') || key.startsWith('GA_'))
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Debug failed',
      details: error.message 
    });
  }
}
