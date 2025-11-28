import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Calendar, Clock, Check, X } from 'lucide-react';
import io from 'socket.io-client'; // Use direct socket.io-client instead
import { createWebRTCSession, completeSession } from '../api';

const WebRTCChat = ({ user, otherUser, userType, sessionId, onSessionInitiated, onSessionAccepted, onJoinSession }) => {
  // Generate a consistent chat room ID based on the users (sorted by ID to ensure consistency)
  const getUserIds = () => {
    const ids = [user.id, otherUser.id].sort();
    console.log('Sorted user IDs for room:', ids);
    return `${ids[0]}_${ids[1]}`;
  };
  
  // For temporary sessions, we use the sessionId directly
  // The sessionId is already consistent between mentor and learner
  const getConsistentSessionId = () => {
    console.log('Using provided sessionId:', sessionId);
    return sessionId || 'default';
  };
  
  const chatRoomId = `chat_${getUserIds()}_${getConsistentSessionId()}`;
  console.log('Final room ID:', chatRoomId);
  console.log('User type:', userType);
  console.log('User:', user);
  console.log('Other user:', otherUser);
  
  // Load messages from localStorage on component mount
  const getInitialMessages = () => {
    try {
      const savedMessages = localStorage.getItem(`chat_messages_${chatRoomId}`);
      const messages = savedMessages ? JSON.parse(savedMessages) : [];
      // Ensure all timestamps are Date objects and sort messages by timestamp
      return messages.map(msg => ({
        ...msg,
        created_at: new Date(msg.created_at)
      })).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      return [];
    }
  };
  
  // Load accepted proposal state from localStorage
  const getInitialAcceptedProposal = () => {
    try {
      const savedProposal = localStorage.getItem(`accepted_proposal_${chatRoomId}`);
      return savedProposal ? JSON.parse(savedProposal) : null;
    } catch (error) {
      console.error('Error loading accepted proposal from localStorage:', error);
      return null;
    }
  };
  
  // Load session timer state from localStorage
  const getInitialSessionTimer = () => {
    try {
      const savedTimer = localStorage.getItem(`session_timer_${chatRoomId}`);
      return savedTimer ? JSON.parse(savedTimer) : null;
    } catch (error) {
      console.error('Error loading session timer from localStorage:', error);
      return null;
    }
  };
  
  const [messages, setMessages] = useState(getInitialMessages());
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionProposal, setSessionProposal] = useState({
    date: '',
    time: '',
    duration: '60',
    topic: ''
  });
  const [pendingProposal, setPendingProposal] = useState(null);
  const messagesEndRef = useRef(null);
  // Replace useSocket hook with direct socket reference
  const socketRef = useRef(null);
  const [acceptedProposal, setAcceptedProposal] = useState(getInitialAcceptedProposal());
  const [sessionTimer, setSessionTimer] = useState(getInitialSessionTimer());
  const timerIntervalRef = useRef(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [complaint, setComplaint] = useState('');
  const [createdSessionId, setCreatedSessionId] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    // Determine the backend URL based on environment
    const backendUrl = import.meta.env.VITE_API_URL || 
                      (window.location.hostname.includes('vercel.app') 
                        ? `https://${window.location.hostname}` 
                        : 'http://localhost:5000');
    
    // Connect to the signaling server with proper configuration
    socketRef.current = io(backendUrl, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
      path: '/socket.io',
      upgrade: false,
      rememberUpgrade: false,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    // Handle connection
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server with ID:', socketRef.current.id);
      console.log('Joining room with ID:', chatRoomId);
      
      // Join the chat room
      socketRef.current.emit("room:join", {
        email: user.email,
        room: chatRoomId
      });
    });

    // Handle connection error
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Handle disconnect
    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Listen for incoming messages
    socketRef.current.on("chat:message", (data) => {
      console.log('Received message:', data);
      const { email, message, timestamp } = data;
      const sender = email === user.email ? user : otherUser;
      
      setMessages(prev => {
        const newMessages = [...prev, {
          id: Date.now() + Math.random(),
          sender_id: sender.id,
          sender: sender,
          message: message,
          created_at: new Date(timestamp),
          message_type: 'text'
        }];
        // Sort messages by timestamp
        const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Save to localStorage
        try {
          localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
        } catch (error) {
          console.error('Error saving messages to localStorage:', error);
        }
        return sortedMessages;
      });
    });

    // Listen for session proposals
    socketRef.current.on("session:propose", (data) => {
      console.log('=== SESSION PROPOSAL EVENT RECEIVED ===');
      console.log('Raw data:', data);
      console.log('Stringified data:', JSON.stringify(data, null, 2));
      console.log('Current user email:', user.email);
      console.log('Current room ID:', chatRoomId);
      
      // Check if this proposal is for us (not from ourselves)
      // More robust check that handles various email property formats
      const proposerEmail = data.proposer?.email || data.proposer?.user_email;
      if (data.proposer && proposerEmail && proposerEmail !== user.email) {
        console.log('Session proposal is for us, showing notification');
        // Show notification about the proposal
        setMessages(prev => {
          const newMessages = [...prev, {
            id: Date.now() + Math.random(),
            sender_id: 'system',
            sender: { first_name: 'System', last_name: '' },
            message: `${data.proposer.first_name} ${data.proposer.last_name} proposed a session`,
            created_at: new Date(),
            message_type: 'system'
          }];
          // Sort messages by timestamp
          const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          // Save to localStorage
          try {
            localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
          } catch (error) {
            console.error('Error saving messages to localStorage:', error);
          }
          return sortedMessages;
        });
        
        // Store the pending proposal
        setPendingProposal(data);
      } else {
        console.log('Session proposal is from ourselves or invalid, ignoring');
        console.log('data.proposer:', data.proposer);
        console.log('proposerEmail:', proposerEmail);
        console.log('user.email:', user.email);
      }
    });

    // Listen for session responses
    socketRef.current.on("session:response", (data) => {
      console.log('=== SESSION RESPONSE EVENT RECEIVED ===');
      console.log('Raw data:', data);
      
      const { responder, response, proposal } = data;
      
      // Check if this response is for us (not from ourselves)
      // More robust check that handles various email property formats
      const responderEmail = responder?.email || responder?.user_email;
      if (responder && responderEmail && responderEmail !== user.email) {
        // Add response to local messages
        setMessages(prev => {
          const newMessages = [...prev, {
            id: Date.now() + Math.random(),
            sender_id: responder.id,
            sender: responder,
            message: `Session ${response}`,
            created_at: new Date(),
            message_type: 'system'
          }];
          // Sort messages by timestamp
          const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          // Save to localStorage
          try {
            localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
          } catch (error) {
            console.error('Error saving messages to localStorage:', error);
          }
          return sortedMessages;
        });
        
        // If accepted, notify parent component and set state for join button
        if (response === 'accepted') {
          onSessionAccepted && onSessionAccepted({
            meetingLink: 'https://meet.jit.si/blocklearn-session-room',
            jitsiRoomName: 'blocklearn-session-room'
          });
          // Set state to show join button
          setAcceptedProposal(proposal);
          
          // Create session in database when proposal is accepted
          handleCreateSession(proposal);
        }
      }
    });

    // Listen for session completion
    socketRef.current.on("session:complete", (data) => {
      console.log('=== SESSION COMPLETE EVENT RECEIVED ===');
      console.log('Raw data:', data);
      
      const { completedBy } = data;
      
      // Add completion message to local messages
      setMessages(prev => {
        const newMessages = [...prev, {
          id: Date.now() + Math.random(),
          sender_id: 'system',
          sender: { first_name: 'System', last_name: '' },
          message: `Session completed by ${completedBy.email === user.email ? 'You' : completedBy.email}`,
          created_at: new Date(),
          message_type: 'system'
        }];
        // Sort messages by timestamp
        const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Save to localStorage
        try {
          localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
        } catch (error) {
          console.error('Error saving messages to localStorage:', error);
        }
        return sortedMessages;
      });
      
      // Clear accepted proposal and session timer
      setAcceptedProposal(null);
      setSessionTimer(null);
      localStorage.removeItem(`accepted_proposal_${chatRoomId}`);
      localStorage.removeItem(`session_timer_${chatRoomId}`);
      
      // Show rating modal
      setShowRatingModal(true);
    });

    // Listen for session end
    socketRef.current.on("session:end", (data) => {
      console.log('=== SESSION END EVENT RECEIVED ===');
      console.log('Raw data:', data);
      
      const { endedBy } = data;
      
      // Add end message to local messages
      setMessages(prev => {
        const newMessages = [...prev, {
          id: Date.now() + Math.random(),
          sender_id: 'system',
          sender: { first_name: 'System', last_name: '' },
          message: `Session ended by ${endedBy.email === user.email ? 'You' : endedBy.email}`,
          created_at: new Date(),
          message_type: 'system'
        }];
        // Sort messages by timestamp
        const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Save to localStorage
        try {
          localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
        } catch (error) {
          console.error('Error saving messages to localStorage:', error);
        }
        return sortedMessages;
      });
      
      // Clear accepted proposal and session timer
      setAcceptedProposal(null);
      setSessionTimer(null);
      localStorage.removeItem(`accepted_proposal_${chatRoomId}`);
      localStorage.removeItem(`session_timer_${chatRoomId}`);
    });

    // Listen for session creation
    socketRef.current.on("session:created", (data) => {
      console.log('=== SESSION CREATED EVENT RECEIVED ===');
      console.log('Raw data:', data);
      
      const { sessionData, createdBy } = data;
      
      // Add creation message to local messages
      setMessages(prev => {
        const newMessages = [...prev, {
          id: Date.now() + Math.random(),
          sender_id: 'system',
          sender: { first_name: 'System', last_name: '' },
          message: `Session created by ${createdBy.email === user.email ? 'You' : createdBy.email}`,
          created_at: new Date(),
          message_type: 'system'
        }];
        // Sort messages by timestamp
        const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Save to localStorage
        try {
          localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
        } catch (error) {
          console.error('Error saving messages to localStorage:', error);
        }
        return sortedMessages;
      });
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('session-created', { detail: sessionData }));
    });

    // Listen for user joined events
    socketRef.current.on("user:joined", (data) => {
      console.log('=== USER JOINED EVENT RECEIVED ===');
      console.log('Raw data:', data);
      console.log('Current user email:', user.email);
      
      const { email } = data;
      if (email !== user.email) {
        console.log('Adding system message for user join');
        // Add a system message that the other user joined
        setMessages(prev => {
          const newMessages = [...prev, {
            id: Date.now() + Math.random(),
            sender_id: 'system',
            sender: { first_name: 'System', last_name: '' },
            message: `${otherUser.first_name} ${otherUser.last_name} joined the chat`,
            created_at: new Date(), // Ensure proper timestamp
            message_type: 'system'
          }];
          // Sort messages by timestamp
          const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          // Save to localStorage
          try {
            localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
          } catch (error) {
            console.error('Error saving messages to localStorage:', error);
          }
          return sortedMessages;
        });
        
        // If both users have joined and we have an accepted proposal, start the timer
        if (acceptedProposal) {
          startSessionTimer();
        }
      }
    });

    // Listen for room join confirmation
    socketRef.current.on("room:join", (data) => {
      console.log('=== ROOM JOIN CONFIRMATION ===');
      console.log('Room join confirmed:', data);
    });

    // Clean up socket connection
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatRoomId, user, otherUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    console.log('Sending message:', newMessage);
    console.log('Room ID:', chatRoomId);
    
    const timestamp = new Date().toISOString();
    
    // Add message to local state immediately
    setMessages(prev => {
      const newMessages = [...prev, {
        id: Date.now() + Math.random(),
        sender_id: user.id,
        sender: user,
        message: newMessage,
        created_at: new Date(timestamp),
        message_type: 'text'
      }];
      // Sort messages by timestamp
      const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      // Save to localStorage
      try {
        localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
      return sortedMessages;
    });

    // Send message through WebRTC signaling
    socketRef.current.emit("chat:message", {
      room: chatRoomId,
      email: user.email,
      message: newMessage,
      timestamp: timestamp
    });

    setNewMessage('');
  };

  const handleInitiateSession = () => {
    setShowSessionForm(true);
  };

  const handleSessionFormChange = (e) => {
    const { name, value } = e.target;
    setSessionProposal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProposeSession = (e) => {
    e.preventDefault();
    
    // Simplified proposer data
    const proposerData = {
      email: user.email,
      first_name: user.first_name || user.firstName || '',
      last_name: user.last_name || user.lastName || '',
      id: user.id
    };
    
    const proposalData = {
      room: chatRoomId,
      proposer: proposerData,
      proposal: sessionProposal
    };
    
    console.log('Sending session proposal:');
    console.log('Proposal data:', proposalData);
    
    // Send proposal through WebRTC signaling
    socketRef.current.emit("session:propose", proposalData);

    // Add proposal to local messages
    setMessages(prev => {
      const newMessages = [...prev, {
        id: Date.now() + Math.random(),
        sender_id: user.id,
        sender: user,
        message: `Proposed session: ${sessionProposal.topic} on ${sessionProposal.date} at ${sessionProposal.time} for ${sessionProposal.duration} minutes`,
        created_at: new Date(),
        message_type: 'proposal',
        metadata: { proposal: sessionProposal }
      }];
      // Sort messages by timestamp
      const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      // Save to localStorage
      try {
        localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
      return sortedMessages;
    });
    
    // Notify parent component
    onSessionInitiated && onSessionInitiated(sessionProposal);
    
    // Reset form
    setShowSessionForm(false);
    setSessionProposal({
      date: '',
      time: '',
      duration: '60',
      topic: ''
    });
  };

  const handleProposalResponse = (response) => {
    console.log('Sending session response:');
    console.log('Room ID:', chatRoomId);
    console.log('Responder:', user);
    console.log('Response:', response);
    console.log('Proposal:', pendingProposal);
    
    // Send response through WebRTC signaling
    socketRef.current.emit("session:response", {
      room: chatRoomId,
      responder: {
        email: user.email,
        first_name: user.first_name || user.firstName || '',
        last_name: user.last_name || user.lastName || '',
        id: user.id
      },
      response: response,
      proposal: pendingProposal.proposal
    });

    // Add response to local messages
    setMessages(prev => {
      const newMessages = [...prev, {
        id: Date.now() + Math.random(),
        sender_id: user.id,
        sender: user,
        message: `Session ${response}`,
        created_at: new Date(),
        message_type: 'system'
      }];
      // Sort messages by timestamp
      const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      // Save to localStorage
      try {
        localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
      return sortedMessages;
    });
    
    // If accepted, notify parent component and set state for join button
    if (response === 'accepted') {
      onSessionAccepted && onSessionAccepted({
        meetingLink: 'https://meet.jit.si/blocklearn-session-room',
        jitsiRoomName: 'blocklearn-session-room'
      });
      // Set state to show join button
      setAcceptedProposal(pendingProposal.proposal);
      
      // Create session in database when proposal is accepted
      handleCreateSession(pendingProposal.proposal);
    }
    
    setPendingProposal(null);
  };

  // Function to create session in database
  const handleCreateSession = async (proposal) => {
    try {
      // Determine mentor and student IDs
      // If current user is mentor, then otherUser is student, and vice versa
      const isCurrentUserMentor = userType === 'mentor';
      const mentorId = isCurrentUserMentor ? user.id : otherUser.id;
      const studentId = isCurrentUserMentor ? otherUser.id : user.id;
      
      // Format the scheduled time
      const scheduledAt = new Date(`${proposal.date}T${proposal.time}`);
      
      // Create session data
      const sessionData = {
        mentor_id: mentorId,
        student_id: studentId,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(proposal.duration),
        location: 'Online',
        notes: proposal.topic
      };
      
      console.log('Creating session in database:', sessionData);
      
      // Call backend API to create session
      const result = await createWebRTCSession(sessionData);
      
      if (result.success) {
        console.log('Session created successfully:', result.data);
        
        // Store the created session ID
        setCreatedSessionId(result.data.id);
        
        // Emit socket event to notify other user
        socketRef.current.emit("session:created", { 
          sessionData: result.data, 
          createdBy: user
        });
      } else {
        console.error('Failed to create session:', result.message);
      }
    } catch (error) {
      console.error('Error creating session in database:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleJoinSession = () => {
    if (acceptedProposal && onJoinSession) {
      // Different URLs for mentor and learner
      let meetingLink;
      let jitsiRoomName;
      
      if (userType === 'mentor') {
        // Mentor redirects to moderated Jitsi room
        meetingLink = 'https://moderated.jitsi.net/0057029a7d5e40fdbae508b18d54bf4f62211d016bd64f9ca248d87870717703';
        jitsiRoomName = '0057029a7d5e40fdbae508b18d54bf4f62211d016bd64f9ca248d87870717703';
        window.location.href = meetingLink;
      } else {
        // Learner joins regular Jitsi room
        meetingLink = 'https://meet.jitsi.net/moderated/b8692948b1e6f09ab6451591d304e8794c73fdaa72a0911c75591a461daa476b';
        jitsiRoomName = 'b8692948b1e6f09ab6451591d304e8794c73fdaa72a0911c75591a461daa476b';
        window.open(meetingLink, '_blank');
      }
      
      // Start the session timer when the user joins
      startSessionTimer();
      
      // Notify parent component
      onJoinSession({
        meetingLink,
        jitsiRoomName
      });
    }
  };

  // Function to start the session timer
  const startSessionTimer = () => {
    // Set initial timer state
    const initialTimerState = {
      isActive: true,
      startTime: Date.now(),
      remaining: 3600, // 60 minutes in seconds
    };
    
    setSessionTimer(initialTimerState);
    
    // Save to localStorage
    try {
      localStorage.setItem(`session_timer_${chatRoomId}`, JSON.stringify(initialTimerState));
    } catch (error) {
      console.error('Error saving session timer to localStorage:', error);
    }
    
    // Start the timer interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setSessionTimer(prevTimer => {
        if (!prevTimer || !prevTimer.isActive) {
          return prevTimer;
        }
        
        const elapsed = Math.floor((Date.now() - prevTimer.startTime) / 1000);
        const remaining = Math.max(0, prevTimer.remaining - elapsed);
        
        const updatedTimer = {
          ...prevTimer,
          remaining
        };
        
        // Save to localStorage
        try {
          localStorage.setItem(`session_timer_${chatRoomId}`, JSON.stringify(updatedTimer));
        } catch (error) {
          console.error('Error saving session timer to localStorage:', error);
        }
        
        // If timer reaches zero, end the session
        if (remaining <= 0) {
          handleEndSession();
        }
        
        return updatedTimer;
      });
    }, 1000); // Update every second
  };

  // Initialize timer if it exists in localStorage when component mounts
  useEffect(() => {
    // Check if there's an active session timer in localStorage
    const savedTimer = getInitialSessionTimer();
    if (savedTimer && savedTimer.isActive) {
      setSessionTimer(savedTimer);
      
      // Resume the timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      timerIntervalRef.current = setInterval(() => {
        setSessionTimer(prevTimer => {
          if (!prevTimer || !prevTimer.isActive) {
            return prevTimer;
          }
          
          const elapsed = Math.floor((Date.now() - prevTimer.startTime) / 1000);
          const remaining = Math.max(0, prevTimer.remaining - elapsed);
          
          const updatedTimer = {
            ...prevTimer,
            remaining
          };
          
          // Save to localStorage
          try {
            localStorage.setItem(`session_timer_${chatRoomId}`, JSON.stringify(updatedTimer));
          } catch (error) {
            console.error('Error saving session timer to localStorage:', error);
          }
          
          // If timer reaches zero, end the session
          if (remaining <= 0) {
            handleEndSession();
          }
          
          return updatedTimer;
        });
      }, 1000); // Update every second
    }
    
    // Clean up interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [chatRoomId]);

  const handleEndSession = () => {
    // Send end session notification to other user
    if (socketRef.current) {
      socketRef.current.emit("session:end", {
        room: chatRoomId,
        endedBy: {
          email: user.email,
          first_name: user.first_name || user.firstName || '',
          last_name: user.last_name || user.lastName || '',
          id: user.id
        }
      });
    }
    
    // Clear the session timer
    setSessionTimer(null);
    
    // Add system message to chat
    setMessages(prev => {
      const newMessages = [...prev, {
        id: Date.now() + Math.random(),
        sender_id: 'system',
        sender: { first_name: 'System', last_name: '' },
        message: 'Session has been ended by the mentor.',
        created_at: new Date(),
        message_type: 'system'
      }];
      // Sort messages by timestamp
      const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      // Save to localStorage
      try {
        localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
      return sortedMessages;
    });
    
    // Clear accepted proposal
    setAcceptedProposal(null);
  };

  const handleCompleteSession = async () => {
    console.log('=== HANDLE COMPLETE SESSION CALLED ===');
    console.log('User type:', userType);
    console.log('Socket available:', !!socketRef.current);
    console.log('Chat room ID:', chatRoomId);
    console.log('Session timer:', sessionTimer);
    console.log('Session timer is active:', sessionTimer?.isActive);
    
    // Send complete session notification to other user
    if (socketRef.current) {
      console.log('Sending session:complete event to room:', chatRoomId);
      socketRef.current.emit("session:complete", {
        room: chatRoomId,
        completedBy: {
          email: user.email,
          first_name: user.first_name || user.firstName || '',
          last_name: user.last_name || user.lastName || '',
          id: user.id
        }
      });
    }
    
    // Clear the session timer
    setSessionTimer(null);
    
    // Add system message to chat
    setMessages(prev => {
      const newMessages = [...prev, {
        id: Date.now() + Math.random(),
        sender_id: 'system',
        sender: { first_name: 'System', last_name: '' },
        message: 'Session has been marked as completed.',
        created_at: new Date(),
        message_type: 'system'
      }];
      // Sort messages by timestamp
      const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      // Save to localStorage
      try {
        localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
      return sortedMessages;
    });
    
    // Clear accepted proposal
    setAcceptedProposal(null);
    
    // Show rating modal only to learner
    // This will be handled by the session:complete event listener
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Submit rating to backend if we have a session ID
      if (createdSessionId) {
        await completeSession(createdSessionId, {
          rating,
          review,
          complaint
        });
        
        console.log('Rating submitted successfully for session:', createdSessionId);
      }
      
      // Add system message to chat
      setMessages(prev => {
        const newMessages = [...prev, {
          id: Date.now() + Math.random(),
          sender_id: 'system',
          sender: { first_name: 'System', last_name: '' },
          message: `Thank you for your feedback! You rated this session ${rating} stars.`,
          created_at: new Date(),
          message_type: 'system'
        }];
        // Sort messages by timestamp
        const sortedMessages = newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Save to localStorage
        try {
          localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(sortedMessages));
        } catch (error) {
          console.error('Error saving messages to localStorage:', error);
        }
        return sortedMessages;
      });
      
      // Close modal
      setShowRatingModal(false);
      
      // Reset form
      setRating(0);
      setReview('');
      setComplaint('');
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  // Scroll to bottom of chat when messages change or component mounts
  useEffect(() => {
    // Scroll to bottom on initial load and when messages change
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    };
    
    // Scroll immediately and then after a small delay to ensure DOM updates
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-primary dark:bg-primary/90 p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-white">
                {otherUser.first_name} {otherUser.last_name}
              </h3>
              <p className="text-primary-100 text-sm">
                {userType === 'mentor' ? 'Student' : 'Mentor'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {userType === 'mentor' && (
              <button
                onClick={handleInitiateSession}
                className="flex items-center px-3 py-1 bg-white text-primary rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors w-full sm:w-auto justify-center"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Propose Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Session Timer - Display when session is scheduled or active */}
      {sessionTimer && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {sessionTimer.isActive ? 'Session in Progress' : 'Session Scheduled'}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-300">
                {acceptedProposal && `${acceptedProposal.date} at ${acceptedProposal.time} (${acceptedProposal.duration} min)`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                {formatTime(sessionTimer.remaining)}
              </p>
              {userType === 'mentor' && sessionTimer && sessionTimer.isActive && (
                <button
                  onClick={handleEndSession}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                >
                  End Session
                </button>
              )}
              {userType === 'mentor' && sessionTimer && sessionTimer.isActive && (
                <button
                  onClick={handleCompleteSession}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                >
                  Complete Session
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - This will be scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Chat Messages - Scrollable area when no form is shown */}
        {!showSessionForm && (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900/50" style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isCurrentUser = message.sender_id === user.id;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-primary text-white rounded-br-none' 
                            : message.message_type === 'system'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-b-none'
                              : message.message_type === 'proposal'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-b-none'
                                : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none'
                        }`}
                      >
                        {!isCurrentUser && message.sender && (
                          <p className="text-xs font-medium mb-1">
                            {message.sender.first_name} {message.sender.last_name}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          isCurrentUser 
                            ? 'text-primary-100' 
                            : message.message_type === 'system'
                              ? 'text-blue-600 dark:text-blue-300'
                              : message.message_type === 'proposal'
                                ? 'text-yellow-600 dark:text-yellow-300'
                                : 'text-gray-500 dark:text-slate-400'
                        }`}>
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} style={{ marginTop: 'auto' }} />
              </>
            )}
          </div>
        )}

        {/* Session Proposal Form - Scrollable form container */}
        {showSessionForm && (
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900/50">
            <div className="border-t border-gray-200 dark:border-slate-700 p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Propose Session Details
              </h4>
              <form onSubmit={handleProposeSession} className="space-y-4 pb-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={sessionProposal.date}
                      onChange={handleSessionFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={sessionProposal.time}
                      onChange={handleSessionFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Duration (minutes)
                    </label>
                    <select
                      name="duration"
                      value={sessionProposal.duration}
                      onChange={handleSessionFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                      <option value="120">120 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Topic
                    </label>
                    <input
                      type="text"
                      name="topic"
                      value={sessionProposal.topic}
                      onChange={handleSessionFormChange}
                      placeholder="What topic would you like to cover?"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSessionForm(false)}
                    className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto"
                  >
                    Propose Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chat Input */}
        {!showSessionForm && (
          <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Session Proposal Popup */}
      {pendingProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Session Proposal
                </h3>
                <button
                  onClick={() => setPendingProposal(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Proposed by</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pendingProposal.proposer.first_name} {pendingProposal.proposer.last_name}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Topic</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pendingProposal.proposal.topic}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pendingProposal.proposal.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Time</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pendingProposal.proposal.time}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">Duration</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pendingProposal.proposal.duration} minutes
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => handleProposalResponse('rejected')}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleProposalResponse('accepted')}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Session Button - appears after accepting a proposal */}
      {acceptedProposal && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={handleJoinSession}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Join Interview
          </button>
        </div>
      )}

      {/* Rating/Review Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Rate This Session
                </h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleRatingSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Rating
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-2xl focus:outline-none"
                        >
                          {star <= rating ? (
                            <span className="text-yellow-400">★</span>
                          ) : (
                            <span className="text-gray-300 dark:text-slate-600">☆</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Review (Optional)
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="What did you like about this session?"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Complaints (Optional)
                    </label>
                    <textarea
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      placeholder="Any issues or concerns?"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows="3"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Submit Rating
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WebRTCChat;