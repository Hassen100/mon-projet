const productionApiBaseUrl = 'https://mon-projet-ve8t.onrender.com/api';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return productionApiBaseUrl;
  }

  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000/api';
  }

  return productionApiBaseUrl;
}
