const io = require('socket.io-client');

console.log('Testing WebSocket connection to http://localhost:5002...');

// Connect to the signaling server
const socket = io('http://localhost:5002', {
  transports: ['websocket'],
  reconnection: false,
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Connected to signaling server with ID:', socket.id);
  
  // Join a test room
  socket.emit('join-room', 'test-room');
  console.log('📋 Joined test room');
  
  // Send a test message
  socket.emit('message', {
    roomId: 'test-room',
    message: {
      text: 'Hello from test client',
      sender: socket.id,
      timestamp: new Date().toISOString()
    }
  });
  
  // Test completed
  setTimeout(() => {
    console.log('✅ Test completed successfully');
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Timeout if connection fails
setTimeout(() => {
  console.error('❌ Connection timeout');
  process.exit(1);
}, 10000);