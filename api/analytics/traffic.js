const { getAnalyticsClient, getPropertyId } = require('../lib/ga-client');

const ORGANIC_FILTER = {
  filter: {
    fieldName: 'sessionDefaultChannelGrouping',
    stringFilter: { matchType: 'EXACT', value: 'Organic Search' }
  }
};

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
    const days = parseInt(req.query.days, 10) || 30;

    const dateRange = {
      startDate: `${days}daysAgo`,
      endDate: 'today'
    };

    const [totalResult, organicResult] = await Promise.all([
      analytics.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [dateRange],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }]
      }),
      analytics.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [dateRange],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: ORGANIC_FILTER
      })
    ]);

    const organicByDate = new Map();
    const organicRows = organicResult[0].rows || [];
    for (const row of organicRows) {
      const d = row.dimensionValues[0].value;
      organicByDate.set(d, parseInt(row.metricValues[0].value || 0, 10));
    }

    const totalRows = totalResult[0].rows || [];
    const result = totalRows.map((row) => {
      const date = row.dimensionValues[0].value;
      return {
        date,
        sessions: parseInt(row.metricValues[0].value || 0, 10),
        organic: organicByDate.get(date) || 0
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Traffic API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch traffic data',
      details: error.message
    });
  }
};
