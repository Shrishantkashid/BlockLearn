const io = require('socket.io-client');

// Test Socket.IO connection with the same configuration as the frontend
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 10000,
  path: '/socket.io',
  upgrade: false,
  rememberUpgrade: false
});

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO server with ID:', socket.id);
  
  // Test joining a room
  socket.emit('join-room', 'test-room');
  console.log('✅ Joined test room');
  
  // Disconnect after 2 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ Disconnected from server');
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket connection error:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from server. Reason:', reason);
});

console.log('Testing Socket.IO connection to http://localhost:5000/socket.io');