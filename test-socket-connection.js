const io = require('socket.io-client');

console.log('Testing Socket.IO connection to http://localhost:5000');

// Test Socket.IO connection
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 10000,
  path: '/socket.io',
  upgrade: false,
  rememberUpgrade: false,
  withCredentials: false
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server with ID:', socket.id);
  
  // Try to join a room
  socket.emit('room:join', {
    email: 'test@example.com',
    room: 'test-room'
  });
  console.log('📤 Joined test room');
  
  // Disconnect after 2 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log('🔌 Disconnected from server');
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected from server. Reason:', reason);
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});