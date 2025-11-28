const io = require('socket.io-client');

console.log('Testing chat communication between two users');

// Create two socket connections to simulate two users
const user1 = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 10000,
  path: '/socket.io',
  upgrade: false,
  rememberUpgrade: false,
  withCredentials: false
});

const user2 = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 10000,
  path: '/socket.io',
  upgrade: false,
  rememberUpgrade: false,
  withCredentials: false
});

let user1Connected = false;
let user2Connected = false;

// User 1 connection
user1.on('connect', () => {
  console.log('✅ User 1 connected to Socket.IO server with ID:', user1.id);
  user1Connected = true;
  
  // Join the chat room
  user1.emit('room:join', {
    email: 'user1@example.com',
    room: 'test-chat-room'
  });
  console.log('📤 User 1 joined test chat room');
  
  // Listen for chat messages
  user1.on('chat:message', (data) => {
    console.log('📥 User 1 received chat message:', data);
  });
  
  // Check if both users are connected and then send a message
  if (user1Connected && user2Connected) {
    setTimeout(() => {
      user1.emit('chat:message', {
        room: 'test-chat-room',
        email: 'user1@example.com',
        message: 'Hello from User 1!',
        timestamp: new Date().toISOString()
      });
      console.log('📤 User 1 sent chat message');
    }, 1000);
  }
});

// User 2 connection
user2.on('connect', () => {
  console.log('✅ User 2 connected to Socket.IO server with ID:', user2.id);
  user2Connected = true;
  
  // Join the chat room
  user2.emit('room:join', {
    email: 'user2@example.com',
    room: 'test-chat-room'
  });
  console.log('📤 User 2 joined test chat room');
  
  // Listen for chat messages
  user2.on('chat:message', (data) => {
    console.log('📥 User 2 received chat message:', data);
    
    // Send a reply
    setTimeout(() => {
      user2.emit('chat:message', {
        room: 'test-chat-room',
        email: 'user2@example.com',
        message: 'Hello back from User 2!',
        timestamp: new Date().toISOString()
      });
      console.log('📤 User 2 sent reply message');
    }, 1000);
  });
  
  // Check if both users are connected and then send a message
  if (user1Connected && user2Connected) {
    setTimeout(() => {
      user1.emit('chat:message', {
        room: 'test-chat-room',
        email: 'user1@example.com',
        message: 'Hello from User 1!',
        timestamp: new Date().toISOString()
      });
      console.log('📤 User 1 sent chat message');
    }, 1000);
  }
});

// Error handlers
user1.on('connect_error', (error) => {
  console.error('❌ User 1 connection error:', error);
});

user2.on('connect_error', (error) => {
  console.error('❌ User 2 connection error:', error);
});

// Disconnect both users after 10 seconds
setTimeout(() => {
  user1.disconnect();
  user2.disconnect();
  console.log('🔌 Both users disconnected from server');
}, 10000);