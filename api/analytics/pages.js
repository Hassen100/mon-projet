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
    const limit = parseInt(req.query.limit, 10) || 10;

    const [response] = await analytics.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [
        {
          metric: { metricName: 'screenPageViews' },
          desc: true
        }
      ],
      limit
    });

    const result = (response.rows || []).map((row) => ({
      page: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value || 0, 10)
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Pages API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch pages data',
      details: error.message
    });
  }
};
