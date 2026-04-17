const PROXY_CONFIG = [
  {
    context: ['/api'],
    target: 'http://localhost:8000',
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api'
    }
  }
];

module.exports = PROXY_CONFIG;
