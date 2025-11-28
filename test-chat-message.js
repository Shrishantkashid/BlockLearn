const io = require('socket.io-client');

console.log('Testing chat message functionality');

// Connect to the Socket.IO server
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
  
  // Join a test room
  socket.emit('room:join', {
    email: 'test@example.com',
    room: 'test-chat-room'
  });
  console.log('📤 Joined test chat room');
  
  // Send a chat message after a short delay to ensure room join is processed
  setTimeout(() => {
    socket.emit('chat:message', {
      room: 'test-chat-room',
      email: 'test@example.com',
      message: 'Hello, this is a test message!',
      timestamp: new Date().toISOString()
    });
    console.log('📤 Sent test chat message');
  }, 1000);
  
  // Listen for chat messages
  socket.on('chat:message', (data) => {
    console.log('📥 Received chat message:', data);
  });
  
  // Disconnect after 5 seconds
  setTimeout(() => {
    socket.disconnect();
    console.log('🔌 Disconnected from server');
  }, 5000);
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