// Simple test to check if the interview session API is working
const http = require('http');

// Test the health endpoint first
const healthOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`Health response: ${chunk}`);
  });
});

healthReq.on('error', (error) => {
  console.error('Health check error:', error);
});

healthReq.end();

console.log('Testing interview session API endpoints...');