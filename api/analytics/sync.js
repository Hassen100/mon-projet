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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const analytics = getAnalyticsClient();
    const propertyId = getPropertyId();
    const dateRange = { startDate: '30daysAgo', endDate: 'today' };

    const [
      overviewResponse,
      totalResult,
      organicResult,
      pagesResponse
    ] = await Promise.all([
      analytics.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [dateRange],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' }
        ]
      }),
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
      }),
      analytics.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [dateRange],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [
          { metric: { metricName: 'screenPageViews' }, desc: true }
        ],
        limit: 10
      })
    ]);

    let overview = {
      sessions: 0,
      users: 0,
      pageViews: 0,
      bounceRate: 0
    };

    if (overviewResponse[0].rows && overviewResponse[0].rows.length > 0) {
      const row = overviewResponse[0].rows[0];
      overview = {
        sessions: parseInt(row.metricValues[0].value || 0, 10),
        users: parseInt(row.metricValues[1].value || 0, 10),
        pageViews: parseInt(row.metricValues[2].value || 0, 10),
        bounceRate: parseFloat(row.metricValues[3].value || 0)
      };
    }

    const organicByDate = new Map();
    for (const row of organicResult[0].rows || []) {
      const d = row.dimensionValues[0].value;
      organicByDate.set(d, parseInt(row.metricValues[0].value || 0, 10));
    }

    const traffic = (totalResult[0].rows || []).map((row) => {
      const date = row.dimensionValues[0].value;
      return {
        date,
        sessions: parseInt(row.metricValues[0].value || 0, 10),
        organic: organicByDate.get(date) || 0
      };
    });

    const pages = (pagesResponse[0].rows || []).map((row) => ({
      page: row.dimensionValues[0].value,
      views: parseInt(row.metricValues[0].value || 0, 10)
    }));

    return res.status(200).json({
      overview,
      traffic,
      pages,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics Sync Error:', error);
    const msg = error && error.message ? String(error.message) : String(error);
    let hint = '';
    if (msg.includes('GA credentials missing') || msg.includes('credentials missing')) {
      hint =
        'Sur Vercel : Project → Settings → Environment Variables. Ajoutez GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY (clé complète avec \\n), et GA_PROPERTY_ID. Puis redéployez.';
    } else if (msg.includes('PERMISSION_DENIED') || /permission/i.test(msg)) {
      hint =
        'Dans Google Analytics : Admin → Accès à la propriété → Ajouter des utilisateurs → e-mail du compte de service (…@….iam.gserviceaccount.com) avec rôle Lecteur.';
    } else if (msg.includes('NOT_FOUND') || msg.includes('not found')) {
      hint =
        'Vérifiez GA_PROPERTY_ID : c’est l’ID numérique GA4 (ex. 123456789), visible dans Admin → Détails de la propriété.';
    } else if (msg.includes('invalid_grant') || msg.includes('Invalid JWT')) {
      hint =
        'Clé privée invalide ou expirée : régénérez une clé JSON dans Google Cloud → IAM → compte de service → Clés, puis mettez à jour GOOGLE_PRIVATE_KEY sur Vercel.';
    }
    return res.status(500).json({
      error: 'Failed to sync analytics data',
      details: msg,
      hint: hint || undefined
    });
  }
};
