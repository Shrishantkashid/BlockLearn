import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const TestWebSocket = () => {
  const [status, setStatus] = useState('Connecting...');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Connect to the signaling server with proper configuration
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
      console.log('Connected to signaling server with ID:', socket.id);
      setStatus(`Connected with ID: ${socket.id}`);
      setMessages(prev => [...prev, `Connected with ID: ${socket.id}`]);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setStatus(`Connection Error: ${error.message}`);
      setMessages(prev => [...prev, `Connection Error: ${error.message}`]);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server. Reason:', reason);
      setStatus(`Disconnected: ${reason}`);
      setMessages(prev => [...prev, `Disconnected: ${reason}`]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>WebSocket Connection Test</h2>
      <p>Status: {status}</p>
      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TestWebSocket;