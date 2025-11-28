const express = require('express');
const { Server } = require('socket.io');

const router = express.Router();

// Store socket.io instance
let io;

// Store email to socket ID mapping
const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

// Initialize socket.io
const initializeSocket = (server) => {
  console.log('Initializing Socket.IO server...');
  
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // List of allowed origins
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:5174',
          'https://blocklearn.vercel.app', // Replace with your actual Vercel URL
          process.env.FRONTEND_URL, // Environment variable for custom domain
        ].filter(Boolean); // Remove any falsy values
        
        // Check if the origin is in our allowed list or is a Vercel preview URL
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
      optionsSuccessStatus: 200
    },
    path: '/socket.io',
    transports: ['websocket'],
    upgrade: false,
    rememberUpgrade: false,
    allowEIO3: true,
    serveClient: false,
    cookie: false,
    perMessageDeflate: false,
    httpCompression: false,
    compression: false,
    connectTimeout: 10000,
    pingInterval: 25000,
    pingTimeout: 5000
  });

  io.on('connection', (socket) => {
    console.log('User connected to Socket.IO:', socket.id);

    // Handle room join
    socket.on("room:join", (data) => {
      const { email, room } = data;
      emailToSocketIdMap.set(email, socket.id);
      socketidToEmailMap.set(socket.id, email);
      socket.join(room);
      
      // Notify others in the room that a new user has joined
      socket.to(room).emit("user:joined", { email, id: socket.id });
      
      // Notify the new user about existing users in the room
      const socketsInRoom = io.sockets.adapter.rooms.get(room);
      if (socketsInRoom) {
        const otherUsers = Array.from(socketsInRoom).filter(id => id !== socket.id);
        otherUsers.forEach(otherSocketId => {
          const otherEmail = socketidToEmailMap.get(otherSocketId);
          if (otherEmail) {
            socket.emit("user:joined", { email: otherEmail, id: otherSocketId });
          }
        });
      }
      
      // Confirm room join to the user
      io.to(socket.id).emit("room:join", data);
    });

    // Handle user call
    socket.on("user:call", ({ to, offer }) => {
      io.to(to).emit("incomming:call", { from: socket.id, offer });
    });

    // Handle call accepted
    socket.on("call:accepted", ({ to, ans }) => {
      io.to(to).emit("call:accepted", { from: socket.id, ans });
    });

    // Handle peer negotiation needed
    socket.on("peer:nego:needed", ({ to, offer }) => {
      console.log("peer:nego:needed", offer);
      io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });

    // Handle peer negotiation done
    socket.on("peer:nego:done", ({ to, ans }) => {
      console.log("peer:nego:done", ans);
      io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    // Handle offer
    socket.on('offer', (data) => {
      console.log('Offer received from:', socket.id, 'to:', data.target || data.roomId);
      console.log('Offer data:', data.offer);

      // Check if this is a room broadcast (mentor-admin call)
      if (data.roomId) {
        socket.to(data.roomId).emit('offer', {
          offer: data.offer,
          sender: socket.id
        });
        console.log('Offer broadcast to room:', data.roomId);
      } else if (data.target) {
        // Check if target socket exists
        const targetSocket = io.sockets.sockets.get(data.target);
        if (targetSocket) {
          targetSocket.emit('offer', {
            offer: data.offer,
            sender: socket.id
          });
          console.log('Offer sent to target:', data.target);
        } else {
          console.log('Target socket not found:', data.target);
          // Try to send to all users in the same room except sender
          socket.rooms.forEach(roomId => {
            if (roomId !== socket.id) {
              socket.to(roomId).emit('offer', {
                offer: data.offer,
                sender: socket.id
              });
              console.log('Offer broadcast to room:', roomId);
            }
          });
        }
      }
    });

    // Handle answer
    socket.on('answer', (data) => {
      console.log('Answer received from:', socket.id, 'to:', data.target || data.roomId);
      console.log('Answer data:', data.answer);

      // Check if this is a room broadcast (mentor-admin call)
      if (data.roomId) {
        socket.to(data.roomId).emit('answer', {
          answer: data.answer,
          sender: socket.id
        });
        console.log('Answer broadcast to room:', data.roomId);
      } else if (data.target) {
        // Check if target socket exists
        const targetSocket = io.sockets.sockets.get(data.target);
        if (targetSocket) {
          targetSocket.emit('answer', {
            answer: data.answer,
            sender: socket.id
          });
          console.log('Answer sent to target:', data.target);
        } else {
          console.log('Target socket not found:', data.target);
          // Try to send to all users in the same room except sender
          socket.rooms.forEach(roomId => {
            if (roomId !== socket.id) {
              socket.to(roomId).emit('answer', {
                answer: data.answer,
                sender: socket.id
              });
              console.log('Answer broadcast to room:', roomId);
            }
          });
        }
      }
    });

    // Handle ICE candidate
    socket.on('ice-candidate', (data) => {
      console.log('ICE candidate received from:', socket.id, 'to:', data.target || data.roomId);
      console.log('ICE candidate data:', data.candidate);

      // Check if this is a room broadcast (mentor-admin call)
      if (data.roomId) {
        socket.to(data.roomId).emit('ice-candidate', {
          candidate: data.candidate,
          sender: socket.id
        });
        console.log('ICE candidate broadcast to room:', data.roomId);
      } else if (data.target) {
        // Check if target socket exists
        const targetSocket = io.sockets.sockets.get(data.target);
        if (targetSocket) {
          targetSocket.emit('ice-candidate', {
            candidate: data.candidate,
            sender: socket.id
          });
          console.log('ICE candidate sent to target:', data.target);
        } else {
          console.log('Target socket not found:', data.target);
          // Try to send to all users in the same room except sender
          socket.rooms.forEach(roomId => {
            if (roomId !== socket.id) {
              socket.to(roomId).emit('ice-candidate', {
                candidate: data.candidate,
                sender: socket.id
              });
              console.log('ICE candidate broadcast to room:', roomId);
            }
          });
        }
      }
    });

    // Handle join room
    socket.on('join-room', (roomId) => {
      console.log('User', socket.id, 'joining room:', roomId);
      socket.join(roomId);
      // Notify others in the room that a new user has joined
      socket.to(roomId).emit('user-joined', socket.id);
      // Also send a list of all users in the room to the new user
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        const usersInRoom = Array.from(room).filter(id => id !== socket.id);
        console.log('Users already in room:', usersInRoom);
        // If there are other users in the room, notify the new user about them
        usersInRoom.forEach(userId => {
          // Notify the new user about existing users
          socket.emit('user-joined', userId);
          // Also notify existing users about the new user (in case they missed it)
          const existingSocket = io.sockets.sockets.get(userId);
          if (existingSocket) {
            existingSocket.emit('user-joined', socket.id);
          }
        });
      }
    });

    // Handle leave room
    socket.on('leave-room', (roomId) => {
      console.log('User', socket.id, 'leaving room:', roomId);
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
    });

    // Handle chat messages
    socket.on('message', (data) => {
      console.log('Received message from:', socket.id, 'in room:', data.roomId, 'message:', data.message);
      // Broadcast message to all users in the room except sender
      if (data.roomId) {
        socket.to(data.roomId).emit('message', {
          message: data.message,
          sender: socket.id, // Include sender ID at the top level for consistency
          senderType: data.senderType, // 'mentor' or 'learner'
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle chat messages for WebRTC chat
    socket.on('chat:message', (data) => {
      console.log('Received chat message from:', socket.id, 'in room:', data.room, 'message:', data.message);
      // Broadcast message to all users in the room except sender
      if (data.room) {
        socket.to(data.room).emit('chat:message', {
          room: data.room,
          email: data.email,
          message: data.message,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle proposed times for session scheduling
    socket.on('propose-time', (data) => {
      console.log('Received proposed time from:', socket.id, 'in room:', data.roomId, 'dateTime:', data.dateTime);
      // Broadcast proposed time to all users in the room except sender
      if (data.roomId) {
        socket.to(data.roomId).emit('propose-time', {
          proposerType: data.proposerType, // 'mentor' or 'learner'
          dateTime: data.dateTime,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle session scheduled event
    socket.on('session-scheduled', (data) => {
      console.log('Session scheduled by:', socket.id, 'in room:', data.roomId);
      // Broadcast session scheduled event to all users in the room except sender
      if (data.roomId) {
        socket.to(data.roomId).emit('session-scheduled', {
          scheduled_at: data.scheduled_at,
          duration_minutes: data.duration_minutes,
          location: data.location || 'Online', // Default to 'Online' if not provided
          notes: data.notes,
          live_session_code: data.live_session_code, // Include live session code
          meeting_link: data.meeting_link // Include meeting link
        });
      }
    });

    // Handle proposal responses
    socket.on('proposal-response', (data) => {
      console.log('Received proposal response from:', socket.id, 'in room:', data.roomId, 'response:', data.response);
      // Broadcast proposal response to all users in the room except sender
      if (data.roomId) {
        socket.to(data.roomId).emit('proposal-response', {
          proposalId: data.proposalId,
          response: data.response, // 'accepted' or 'rejected'
          responderType: data.responderType, // 'mentor' or 'learner'
          dateTime: data.dateTime,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle session proposals
    socket.on('session:propose', (data) => {
      console.log('Received session proposal from:', socket.id, 'in room:', data.room);
      console.log('Proposal data:', data);
      // Broadcast session proposal to all users in the room except sender
      if (data.room) {
        socket.to(data.room).emit('session:propose', {
          room: data.room,
          proposer: data.proposer,
          proposal: data.proposal,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle session responses
    socket.on('session:response', (data) => {
      console.log('Received session response from:', socket.id, 'in room:', data.room);
      console.log('Response data:', data);
      // Broadcast session response to all users in the room except sender
      if (data.room) {
        socket.to(data.room).emit('session:response', {
          room: data.room,
          responder: data.responder,
          response: data.response,
          proposal: data.proposal,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle session creation
    socket.on('session:created', (data) => {
      console.log('Received session created event from:', socket.id, 'in room:', data.room);
      console.log('Session data:', data);
      // Broadcast session creation to all users in the room except sender
      if (data.room) {
        socket.to(data.room).emit('session:created', {
          room: data.room,
          sessionData: data.sessionData,
          createdBy: data.createdBy,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle session end
    socket.on('session:end', (data) => {
      console.log('Received session end event from:', socket.id, 'in room:', data.room);
      console.log('End data:', data);
      // Broadcast session end to all users in the room except sender
      if (data.room) {
        socket.to(data.room).emit('session:end', {
          room: data.room,
          endedBy: data.endedBy,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle session completion
    socket.on('session:complete', (data) => {
      console.log('Received session complete event from:', socket.id, 'in room:', data.room);
      console.log('Complete data:', data);
      // Broadcast session completion to all users in the room except sender
      if (data.room) {
        socket.to(data.room).emit('session:complete', {
          room: data.room,
          completedBy: data.completedBy,
          timestamp: data.timestamp || new Date().toISOString()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('User disconnected from Socket.IO:', socket.id, 'Reason:', reason);
      // Remove from maps
      const email = socketidToEmailMap.get(socket.id);
      if (email) {
        emailToSocketIdMap.delete(email);
        socketidToEmailMap.delete(socket.id);
      }
      
      // Notify others in the same rooms
      socket.rooms.forEach(roomId => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit('user-left', socket.id);
        }
      });
    });
  });

  console.log('Socket.io signaling server initialized with path: /socket.io');
  return io;
};

module.exports = { 
  router,
  initializeSocket,
  getIO: () => io
};