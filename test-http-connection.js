// Simple HTTP connection test
const http = require('http');
const https = require('https');
const url = require('url');

// Test HTTP connection to see if the server responds
console.log('Testing HTTP connection to http://localhost:5000/socket.io/');

const parsedUrl = new URL('http://localhost:5000/socket.io/');
const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port,
  path: parsedUrl.pathname + parsedUrl.search,
  method: 'GET',
  headers: {
    'Connection': 'Upgrade',
    'Upgrade': 'websocket',
    'Sec-WebSocket-Version': '13',
    'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ=='
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ HTTP response status: ${res.statusCode}`);
  console.log(`✅ HTTP response headers:`, res.headers);
  
  res.on('data', (chunk) => {
    console.log(`Received chunk: ${chunk}`);
  });
});

req.on('error', (error) => {
  console.error('❌ HTTP connection error:', error.message);
});

req.end();