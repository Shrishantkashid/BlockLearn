// Simple WebSocket connection test
const http = require('http');
const WebSocket = require('ws');

// First, let's try to connect directly to the WebSocket endpoint
console.log('Testing direct WebSocket connection to ws://localhost:5000/socket.io/?EIO=4&transport=websocket');

try {
  const ws = new WebSocket('ws://localhost:5000/socket.io/?EIO=4&transport=websocket');

  ws.on('open', function open() {
    console.log('✅ Direct WebSocket connection opened');
    ws.close();
  });

  ws.on('error', function error(err) {
    console.error('❌ Direct WebSocket connection error:', err.message);
  });

  ws.on('close', function close() {
    console.log('🔌 Direct WebSocket connection closed');
  });
} catch (error) {
  console.error('❌ Error creating WebSocket connection:', error.message);
}

// Also test HTTP connection to see if the server responds
console.log('\nTesting HTTP connection to http://localhost:5000/socket.io/');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/socket.io/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ HTTP response status: ${res.statusCode}`);
  console.log(`✅ HTTP response headers: ${JSON.stringify(res.headers)}`);
});

req.on('error', (error) => {
  console.error('❌ HTTP connection error:', error.message);
});

req.end();