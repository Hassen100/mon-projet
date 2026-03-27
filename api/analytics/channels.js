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
      dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 12
    });

    const items = (response.rows || []).map((row) => ({
      channel: row.dimensionValues[0].value || '(not set)',
      sessions: parseInt(row.metricValues[0].value || 0, 10)
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error('Channels API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch channel data',
      details: error.message
    });
  }
};
