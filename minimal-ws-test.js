// Simple WebSocket test using the built-in WebSocket API
const WebSocket = require('ws');

console.log('Testing WebSocket connection to ws://localhost:5000/socket.io/');

// Try to connect to the Socket.IO WebSocket endpoint
const ws = new WebSocket('ws://localhost:5000/socket.io/?EIO=4&transport=websocket');

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened');
  ws.close();
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket connection error:', err);
});

ws.on('close', function close() {
  console.log('🔌 WebSocket connection closed');
});