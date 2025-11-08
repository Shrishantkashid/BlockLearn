const io = require('socket.io-client');

// Connect to the signaling server
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  path: '/socket.io',
  upgrade: false,
  rememberUpgrade: false
});

socket.on('connect', () => {
  console.log('✅ Connected to signaling server with ID:', socket.id);
  
  // Join a test room
  socket.emit('join-room', 'test-room');
  console.log('Joined test room');
  
  // Test sending a message
  socket.emit('offer', {
    target: 'test-target',
    offer: { type: 'test', data: 'test offer' }
  });
  console.log('Sent test offer');
  
  // Disconnect after 2 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log('Disconnected from server');
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

console.log('Testing WebSocket connection to http://localhost:5000/socket.io');