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
      dimensions: [{ name: 'searchQuery' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit
    });

    const items = (response.rows || [])
      .map((row) => {
        const keyword = (row.dimensionValues[0].value || '').trim();
        if (!keyword || keyword === '(not set)') return null;
        return {
          keyword,
          sessions: parseInt(row.metricValues[0].value || 0, 10)
        };
      })
      .filter(Boolean);

    return res.status(200).json({ items });
  } catch (error) {
    console.error('Keywords API Error:', error);
    return res.status(200).json({
      items: [],
      note:
        'Requêtes indisponibles (liez Search Console à cette propriété GA4, ou données encore vides).'
    });
  }
};
