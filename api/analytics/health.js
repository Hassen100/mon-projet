const { getAnalyticsClient, getPropertyId } = require('../lib/ga-client');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let gaReady = false;
  try {
    getAnalyticsClient();
    gaReady = true;
  } catch {
    gaReady = false;
  }

  return res.status(200).json({
    status: 'healthy',
    service: 'SEO Analytics API (Vercel Functions)',
    property_id: getPropertyId(),
    ga_credentials_configured: gaReady,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};
