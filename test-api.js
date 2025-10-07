const http = require('http');

const endpoints = [
  { method: 'GET', path: '/api/health' },
  { method: 'POST', path: '/api/auth/login', data: { email: 'test@test.com', password: 'test' } },
  { method: 'POST', path: '/api/auth/google', data: { credential: 'test-credential' } },
  { method: 'GET', path: '/api/sessions' },
  { method: 'POST', path: '/api/sessions', data: { mentor_id: 1, skill_id: 1, scheduled_at: new Date().toISOString() } },
  { method: 'POST', path: '/api/chat/message', data: { message: 'test message' } },
  { method: 'POST', path: '/api/feedback', data: { sessionId: 1, rating: 5 } },
  { method: 'POST', path: '/api/blockchain/verify', data: { sessionId: 1, skillId: 1, userId: 1 } },
  { method: 'GET', path: '/api/skills' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const postData = endpoint.data ? JSON.stringify(endpoint.data) : '';

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
        resolve({ endpoint, statusCode: res.statusCode, response: data });
      });
    });

    req.on('error', (err) => {
      console.log(`${endpoint.method} ${endpoint.path} - Error: ${err.message}`);
      resolve({ endpoint, error: err.message });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing all API endpoints...\n');

  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  console.log('\n📊 Results Summary:');
  const successful = results.filter(r => r.statusCode >= 200 && r.statusCode < 300);
  const failed = results.filter(r => r.statusCode >= 400 || r.error);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed endpoints:');
    failed.forEach(f => {
      console.log(`   ${f.endpoint.method} ${f.endpoint.path} - ${f.error || `Status: ${f.statusCode}`}`);
    });
  }

  console.log('\n🎯 Testing completed!');
}

runTests().catch(console.error);
