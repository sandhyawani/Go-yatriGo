const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

const endpoints = [
  '/',
  '/api/health',
  '/api/auth/profile', 
  '/api/users',
  '/api/posts',
  '/api/stories',
  '/api/social',
  '/api/journeys',
];

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
        });
      });
    }).on('error', (err) => {
      resolve({
        path,
        status: 'ERROR',
        error: err.message
      });
    });
  });
}

async function runHealthCheck() {
  console.log(`Starting API Health Check against ${BASE_URL}...`);
  console.log('Note: 401/403/400 are EXPECTED for protected/invalid endpoints if no auth is provided.');
  console.log('----------------------------------------------------');
  
  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    // We consider 200, 401, 403, 400, 404 (if standard express not found) as valid application responses
    if (result.status >= 200 && result.status < 500) {
      console.log(`[PASS] [${result.status}] ${result.path}`);
      passed++;
    } else {
      console.log(`[FAIL] [${result.status}] ${result.path} - ${result.error || 'Server Error'}`);
      failed++;
    }
  }

  console.log('----------------------------------------------------');
  console.log(`Health check complete. Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runHealthCheck();
