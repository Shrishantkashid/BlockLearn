// Test script for multi-user signaling server
// This script tests the signaling server's ability to handle multiple participants in a room

const io = require('socket.io-client');

// Connect two clients to test multi-user functionality
const client1 = io('http://localhost:5000');
const client2 = io('http://localhost:5000');

const roomId = 'test-room-' + Date.now();

console.log('Testing multi-user signaling with room ID:', roomId);

// Client 1 connection
client1.on('connect', () => {
  console.log('Client 1 connected with ID:', client1.id);
  client1.emit('join-room', roomId);
});

client1.on('user-joined', (userId) => {
  console.log('Client 1: User joined:', userId);
  if (userId !== client1.id) {
    console.log('Client 1: Sending offer to', userId);
    // Send an offer to the other user
    client1.emit('offer', {
      target: userId,
      offer: {
        type: 'offer',
        sdp: 'test-offer-sdp'
      }
    });
  }
});

client1.on('offer', (data) => {
  console.log('Client 1: Received offer from', data.sender);
  // Send an answer back
  client1.emit('answer', {
    target: data.sender,
    answer: {
      type: 'answer',
      sdp: 'test-answer-sdp'
    }
  });
});

client1.on('answer', (data) => {
  console.log('Client 1: Received answer from', data.sender);
});

client1.on('ice-candidate', (data) => {
  console.log('Client 1: Received ICE candidate from', data.sender);
});

// Client 2 connection
client2.on('connect', () => {
  console.log('Client 2 connected with ID:', client2.id);
  client2.emit('join-room', roomId);
});

client2.on('user-joined', (userId) => {
  console.log('Client 2: User joined:', userId);
  if (userId !== client2.id) {
    console.log('Client 2: Sending offer to', userId);
    // Send an offer to the other user
    client2.emit('offer', {
      target: userId,
      offer: {
        type: 'offer',
        sdp: 'test-offer-sdp-2'
      }
    });
  }
});

client2.on('offer', (data) => {
  console.log('Client 2: Received offer from', data.sender);
  // Send an answer back
  client2.emit('answer', {
    target: data.sender,
    answer: {
      type: 'answer',
      sdp: 'test-answer-sdp-2'
    }
  });
});

client2.on('answer', (data) => {
  console.log('Client 2: Received answer from', data.sender);
});

client2.on('ice-candidate', (data) => {
  console.log('Client 2: Received ICE candidate from', data.sender);
});

// Handle disconnect
client1.on('disconnect', () => {
  console.log('Client 1 disconnected');
});

client2.on('disconnect', () => {
  console.log('Client 2 disconnected');
});

// Clean up after 10 seconds
setTimeout(() => {
  console.log('Test completed, disconnecting clients');
  client1.disconnect();
  client2.disconnect();
}, 10000);