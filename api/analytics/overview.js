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

  try {
    const analytics = getAnalyticsClient();
    const propertyId = getPropertyId();

    const [response] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' }
      ]
    });

    if (response.rows && response.rows.length > 0) {
      const row = response.rows[0];
      return res.status(200).json({
        sessions: parseInt(row.metricValues[0].value || 0, 10),
        users: parseInt(row.metricValues[1].value || 0, 10),
        pageViews: parseInt(row.metricValues[2].value || 0, 10),
        bounceRate: parseFloat(row.metricValues[3].value || 0)
      });
    }

    return res.status(200).json({
      sessions: 0,
      users: 0,
      pageViews: 0,
      bounceRate: 0
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch analytics data',
      details: error.message
    });
  }
};
