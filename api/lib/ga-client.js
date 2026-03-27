'use strict';

const { GoogleAuth } = require('google-auth-library');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'];

let cachedClient = null;

function buildGoogleAuth() {
  const pk = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (pk && process.env.GOOGLE_CLIENT_EMAIL) {
    return new GoogleAuth({
      credentials: {
        type: 'service_account',
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: pk
      },
      scopes: SCOPES
    });
  }
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    return new GoogleAuth({
      keyFile,
      scopes: SCOPES
    });
  }
  throw new Error(
    'GA credentials missing: set GOOGLE_PRIVATE_KEY + GOOGLE_CLIENT_EMAIL (Vercel), or GOOGLE_APPLICATION_CREDENTIALS (path to JSON locally)'
  );
}

function getAnalyticsClient() {
  if (!cachedClient) {
    cachedClient = new BetaAnalyticsDataClient({ auth: buildGoogleAuth() });
  }
  return cachedClient;
}

function getPropertyId() {
  return process.env.GA_PROPERTY_ID || '526389101';
}

module.exports = { getAnalyticsClient, getPropertyId };
