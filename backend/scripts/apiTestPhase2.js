const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(`${BASE_URL}${path}`, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch(e) {}
        resolve({
          status: res.statusCode,
          data: parsed
        });
      });
    });

    req.on('error', (err) => resolve({ status: 'ERROR', error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("=== PHASE 2 API VERIFICATION ===");
  const results = [];
  
  const testEmail = `test_${Date.now()}@example.com`;
  const testPass = 'Password123!';
  
  let res = await makeRequest('POST', '/api/auth/register', {
    name: 'Test User',
    email: testEmail,
    password: testPass,
    username: `testuser_${Date.now()}`,
    acceptedPolicies: true,
    state: "Delhi",
    city: "New Delhi"
  });
  
  let token = null;
  if (res.status === 200 || res.status === 201) {
    console.log(`[PASS] Register (Auth)`);
    results.push({ endpoint: 'POST /api/auth/register', result: 'PASS' });
    token = res.data.token || (res.data.data && res.data.data.token);
  } else {
    console.log(`[FAIL] Register: ${res.status} - ${JSON.stringify(res.data)}`);
    results.push({ endpoint: 'POST /api/auth/register', result: `FAILED (${res.status})` });
  }

  res = await makeRequest('POST', '/api/auth/login', {
    email: testEmail,
    password: testPass
  });
  
  if (res.status === 200) {
    console.log(`[PASS] Login (Auth)`);
    results.push({ endpoint: 'POST /api/auth/login', result: 'PASS' });
    if (!token) token = res.data.token || (res.data.data && res.data.data.token);
  } else {
    console.log(`[FAIL] Login: ${res.status}`);
    results.push({ endpoint: 'POST /api/auth/login', result: `FAILED (${res.status})` });
  }

  const endpointsToTest = [
    { method: 'GET', path: '/api/users/explore/suggestions' },
    { method: 'GET', path: '/api/posts/feed' },
    { method: 'GET', path: '/api/journeys/my' },
    { method: 'GET', path: '/api/chat/conversations' },
    { method: 'GET', path: '/api/social/feed' },
    { method: 'GET', path: '/api/nonexistent-route-for-404-test' }
  ];

  for (const ep of endpointsToTest) {
    let unauth = await makeRequest(ep.method, ep.path);
    let auth = await makeRequest(ep.method, ep.path, null, token);
    
    let classification = 'UNKNOWN';
    if (unauth.status === 404 && auth.status === 404) classification = 'REAL 404';
    else if (unauth.status === 401 || unauth.status === 403) {
      if (auth.status >= 200 && auth.status < 400) classification = 'PASS';
      else if (auth.status >= 400 && auth.status < 500) classification = 'EXPECTED VALIDATION ERROR';
      else if (auth.status >= 500) classification = 'SERVER ERROR';
    } else if (auth.status >= 200 && auth.status < 400) {
      classification = 'PASS';
    } else if (auth.status >= 500) classification = 'SERVER ERROR';
    else if (auth.status === 404) classification = 'REAL 404';
    
    console.log(`[${classification}] ${ep.method} ${ep.path} (Auth: ${auth.status}, Unauth: ${unauth.status})`);
    results.push({ endpoint: `${ep.method} ${ep.path}`, result: classification });
  }
}

runTests();
