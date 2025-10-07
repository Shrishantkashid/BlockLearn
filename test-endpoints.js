// Debug script to test all API endpoints
const http = require('http');

const testEndpoints = [
  { method: 'GET', path: '/api/health' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/google' },
  { method: 'GET', path: '/api/sessions' },
  { method: 'POST', path: '/api/sessions' },
  { method: 'POST', path: '/api/chat/message' },
  { method: 'POST', path: '/api/feedback' },
  { method: 'POST', path: '/api/blockchain/verify' },
  { method: 'GET', path: '/api/skills' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const postData = endpoint.method === 'POST' ? JSON.stringify({
      email: 'test@test.com',
      password: 'test123'
    }) : '';

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`${endpoint.method} ${endpoint.path} - Status: ${res.statusCode}`);
        if (res.statusCode === 404) {
          console.log(`❌ 404 Error for ${endpoint.method} ${endpoint.path}`);
        }
        resolve({ endpoint, statusCode: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Error for ${endpoint.method} ${endpoint.path}:`, err.message);
      resolve({ endpoint, error: err.message });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('🧪 Testing all API endpoints...\n');

  const results = [];
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Test Results Summary:');
  const failures = results.filter(r => r.statusCode === 404 || r.error);
  const successes = results.filter(r => r.statusCode && r.statusCode !== 404 && !r.error);

  console.log(`✅ Successful: ${successes.length}`);
  console.log(`❌ Failed: ${failures.length}`);

  if (failures.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failures.forEach(f => {
      console.log(`   ${f.endpoint.method} ${f.endpoint.path} - ${f.error || `Status: ${f.statusCode}`}`);
    });
  }

  console.log('\n🎯 All endpoints tested!');
}

// Run the tests
runAllTests().catch(console.error);
