const https = require('https');

https.get('https://httpbin.org/get', (res) => {
  console.log('HTTP Status:', res.statusCode);
}).on('error', (e) => {
  console.error('HTTPS Error:', e.message);
});
