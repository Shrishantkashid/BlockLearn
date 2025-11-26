import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Calendar, Clock, Check, X } from 'lucide-react';
import { useSocket } from '../../../React-webRTC/client/src/context/SocketProvider';
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
      return savedMessages ? JSON.parse(savedMessages) : [];
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
  const socket = useSocket();
  const [acceptedProposal, setAcceptedProposal] = useState(getInitialAcceptedProposal());
  const [sessionTimer, setSessionTimer] = useState(getInitialSessionTimer());
  const timerIntervalRef = useRef(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [complaint, setComplaint] = useState('');
  const [createdSessionId, setCreatedSessionId] = useState(null);

  // Check if session should be active on mount
  useEffect(() => {
    console.log('=== COMPONENT MOUNT CHECK ===');
    console.log('Initial accepted proposal:', acceptedProposal);
    console.log('Initial session timer:', sessionTimer);
    
    // If we have an accepted proposal but no session timer, initialize it
    if (acceptedProposal && !sessionTimer) {
      console.log('Found accepted proposal but no session timer, initializing...');
      const sessionDateTime = new Date(`${acceptedProposal.date}T${acceptedProposal.time}`);
      const now = new Date();
      const timeUntilStart = sessionDateTime - now;
      
      console.log('Session date time:', sessionDateTime);
      console.log('Current time:', now);
      console.log('Time until start (ms):', timeUntilStart);
      
      let timerData;
      
      // If session is in the future, set up timer to start it
      if (timeUntilStart > 0) {
        console.log('Setting up future session timer');
        timerData = {
          startTime: sessionDateTime.getTime(),
          duration: parseInt(acceptedProposal.duration) * 60, // Convert minutes to seconds
          remaining: parseInt(acceptedProposal.duration) * 60,
          isActive: false
        };
      } else if (timeUntilStart <= 0 && timeUntilStart > -acceptedProposal.duration * 60 * 1000) {
        console.log('Setting up active session timer');
        // Session is currently active
        const elapsed = Math.abs(timeUntilStart) / 1000;
        const remaining = (parseInt(acceptedProposal.duration) * 60) - elapsed;
        
        timerData = {
          startTime: sessionDateTime.getTime(),
          duration: parseInt(acceptedProposal.duration) * 60,
          remaining: remaining > 0 ? remaining : 0,
          isActive: true
        };
      } else {
        console.log('Session is in the past');
        // Even if session is in the past, if it was recently active, we should show the complete button
        const timeSinceSessionEnd = Math.abs(timeUntilStart) - (acceptedProposal.duration * 60 * 1000);
        if (timeSinceSessionEnd < 60 * 60 * 1000) { // Within last hour
          console.log('Session was recently active, setting up active timer');
          timerData = {
            startTime: sessionDateTime.getTime(),
            duration: parseInt(acceptedProposal.duration) * 60,
            remaining: 0,
            isActive: true
          };
        } else {
          timerData = null;
        }
      }
      
      if (timerData) {
        console.log('Setting initial session timer:', timerData);
        setSessionTimer(timerData);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`chat_messages_${chatRoomId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [messages, chatRoomId]);
  
  // Save accepted proposal to localStorage whenever it changes
  useEffect(() => {
    try {
      if (acceptedProposal) {
        localStorage.setItem(`accepted_proposal_${chatRoomId}`, JSON.stringify(acceptedProposal));
      } else {
        localStorage.removeItem(`accepted_proposal_${chatRoomId}`);
      }
    } catch (error) {
      console.error('Error saving accepted proposal to localStorage:', error);
    }
  }, [acceptedProposal, chatRoomId]);
  
  // Save session timer to localStorage whenever it changes
  useEffect(() => {
    try {
      if (sessionTimer) {
        localStorage.setItem(`session_timer_${chatRoomId}`, JSON.stringify(sessionTimer));
      } else {
        localStorage.removeItem(`session_timer_${chatRoomId}`);
      }
    } catch (error) {
      console.error('Error saving session timer to localStorage:', error);
    }
  }, [sessionTimer, chatRoomId]);
  
  // Timer effect to handle session countdown
  useEffect(() => {
    console.log('=== SESSION TIMER INITIALIZATION EFFECT ===');
    console.log('Accepted proposal:', acceptedProposal);
    console.log('Session timer:', sessionTimer);
    console.log('User type:', userType);
    
    if (acceptedProposal && !sessionTimer) {
      console.log('Initializing session timer');
      // Calculate session start time
      const sessionDateTime = new Date(`${acceptedProposal.date}T${acceptedProposal.time}`);
      const now = new Date();
      const timeUntilStart = sessionDateTime - now;
      
      console.log('Session date time:', sessionDateTime);
      console.log('Current time:', now);
      console.log('Time until start (ms):', timeUntilStart);
      console.log('Session duration (min):', acceptedProposal.duration);
      console.log('Session duration (ms):', acceptedProposal.duration * 60 * 1000);
      
      // If session is in the future, set up timer to start it
      if (timeUntilStart > 0) {
        console.log('Setting up future session timer');
        const timerData = {
          startTime: sessionDateTime.getTime(),
          duration: parseInt(acceptedProposal.duration) * 60, // Convert minutes to seconds
          remaining: parseInt(acceptedProposal.duration) * 60,
          isActive: false
        };
        
        setSessionTimer(timerData);
      } else if (timeUntilStart <= 0 && timeUntilStart > -acceptedProposal.duration * 60 * 1000) {
        console.log('Setting up active session timer');
        // Session is currently active
        const elapsed = Math.abs(timeUntilStart) / 1000;
        const remaining = (parseInt(acceptedProposal.duration) * 60) - elapsed;
        
        const timerData = {
          startTime: sessionDateTime.getTime(),
          duration: parseInt(acceptedProposal.duration) * 60,
          remaining: remaining > 0 ? remaining : 0,
          isActive: true
        };
        
        setSessionTimer(timerData);
      } else {
        console.log('Session is in the past, not setting up timer');
        // Even if session is in the past, if it was recently active, we should show the complete button
        const timeSinceSessionEnd = Math.abs(timeUntilStart) - (acceptedProposal.duration * 60 * 1000);
        if (timeSinceSessionEnd < 60 * 60 * 1000) { // Within last hour
          console.log('Session was recently active, setting up active timer');
          const timerData = {
            startTime: sessionDateTime.getTime(),
            duration: parseInt(acceptedProposal.duration) * 60,
            remaining: 0,
            isActive: true
          };
          setSessionTimer(timerData);
        }
      }
    } else if (!acceptedProposal) {
      console.log('No accepted proposal, not initializing timer');
    } else if (sessionTimer) {
      console.log('Session timer already exists, not reinitializing');
    }
    
    // Clean up interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [acceptedProposal]);

  // Timer interval effect
  useEffect(() => {
    console.log('=== SESSION TIMER INTERVAL EFFECT ===');
    console.log('Session timer:', sessionTimer);
    console.log('User type:', userType);
    
    // Clear any existing interval
    if (timerIntervalRef.current) {
      console.log('Clearing existing timer interval');
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Set up new interval if we have a session timer
    if (sessionTimer) {
      console.log('Setting up new timer interval');
      timerIntervalRef.current = setInterval(() => {
        setSessionTimer(prevTimer => {
          if (!prevTimer) return null;
          
          const now = Date.now();
          const sessionStartTime = prevTimer.startTime;
          const timeUntilStart = sessionStartTime - now;
          
          console.log('Timer update - timeUntilStart:', timeUntilStart);
          console.log('Timer update - isActive:', prevTimer.isActive);
          
          // Session hasn't started yet
          if (timeUntilStart > 0) {
            // Update countdown to start time
            const secondsUntilStart = Math.floor(timeUntilStart / 1000);
            console.log('Session not started yet, seconds until start:', secondsUntilStart);
            return {
              ...prevTimer,
              remaining: secondsUntilStart > 0 ? secondsUntilStart : 0
            };
          }
          
          // Session should be active now
          if (!prevTimer.isActive && timeUntilStart <= 0) {
            console.log('Session is now active, sending email notifications');
            console.log('Time until start:', timeUntilStart);
            console.log('Session duration:', prevTimer.duration);
            // Send email notifications when session starts
            sendSessionStartEmails();
            
            return {
              ...prevTimer,
              isActive: true,
              remaining: prevTimer.duration
            };
          }
          
          // Session is active, update remaining time
          if (prevTimer.isActive) {
            const newRemaining = prevTimer.remaining - 1;
            console.log('Session is active, remaining time:', newRemaining);
            
            // Session ended
            if (newRemaining <= 0) {
              console.log('Session timer ended, clearing interval');
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              return null;
            }
            
            return {
              ...prevTimer,
              remaining: newRemaining
            };
          }
          
          return prevTimer;
        });
      }, 1000);
    } else {
      console.log('No session timer, not setting up interval');
    }
    
    // Clean up interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        console.log('Cleaning up timer interval on unmount');
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [sessionTimer]);
  
  // Function to send email notifications when session starts
  const sendSessionStartEmails = async () => {
    try {
      // In a real implementation, you would call your backend API to send emails
      console.log('Sending session start emails to mentor and learner');
      
      // Add system message to chat
      const emailMessage = {
        id: Date.now() + Math.random(),
        sender_id: 'system',
        sender: { first_name: 'System', last_name: '' },
        message: 'Session has started! Email notifications sent to both participants.',
        created_at: new Date(),
        message_type: 'system'
      };
      
      setMessages(prev => [...prev, emailMessage]);
    } catch (error) {
      console.error('Error sending session start emails:', error);
    }
  };
  
  // Format time for display (HH:MM:SS)
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Join the chat room when component mounts
  useEffect(() => {
    if (socket) {
      console.log('=== SOCKET CONNECTION INFO ===');
      console.log('Socket connection status:', socket.connected);
      console.log('User email:', user.email);
      console.log('Other user email:', otherUser.email);
      console.log('Current user ID:', user.id);
      console.log('Other user ID:', otherUser.id);
      console.log('User IDs:', getUserIds());
      console.log('Session ID:', getConsistentSessionId());
      console.log('Attempting to join room:', chatRoomId);
      
      // Join the chat room
      socket.emit("room:join", {
        email: user.email,
        room: chatRoomId
      });

      // Listen for incoming messages
      socket.on("chat:message", (data) => {
        console.log('Received message:', data);
        const { email, message, timestamp } = data;
        const sender = email === user.email ? user : otherUser;
        
        setMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          sender_id: sender.id,
          sender: sender,
          message: message,
          created_at: new Date(timestamp),
          message_type: 'text'
        }]);
      });

      // Listen for session proposals
      socket.on("session:propose", (data) => {
        console.log('=== SESSION PROPOSAL EVENT RECEIVED ===');
        console.log('Raw data:', data);
        console.log('Stringified data:', JSON.stringify(data, null, 2));
        console.log('Current user email:', user.email);
        console.log('Current room ID:', chatRoomId);
        
        // Check if we have the required data
        if (!data || !data.proposer || !data.proposal) {
          console.error('Invalid proposal data received:', data);
          return;
        }
        
        const { proposer, proposal } = data;
        console.log('Proposer email:', proposer.email);
        console.log('Proposal details:', proposal);
        
        // Make sure this isn't our own proposal coming back
        if (proposer.email === user.email) {
          console.log('Ignoring own proposal');
          return;
        }
        
        // Set the pending proposal to trigger the popup
        setPendingProposal({ proposer, proposal });
        
        console.log('Pending proposal set:', { proposer, proposal });
      });

      // Listen for session proposal responses
      socket.on("session:response", (data) => {
        console.log('=== RECEIVED SESSION RESPONSE ===');
        console.log('Data received:', data);
        console.log('Current room ID:', chatRoomId);
        console.log('Current user:', user);
        console.log('Other user:', otherUser);
        
        const { responder, response, proposal } = data;
        
        // Add response to messages
        const responseMessage = {
          id: Date.now() + Math.random(),
          sender_id: responder.id,
          sender: responder,
          message: `Session ${response}`,
          created_at: new Date(),
          message_type: 'system'
        };
        
        setMessages(prev => [...prev, responseMessage]);
        
        // If accepted, notify parent component and set state for join button
        if (response === 'accepted') {
          onSessionAccepted && onSessionAccepted({
            meetingLink: 'https://meet.jit.si/blocklearn-session-room',
            jitsiRoomName: 'blocklearn-session-room'
          });
          // Set state to show join button for both mentor and learner
          const proposalData = pendingProposal ? pendingProposal.proposal : proposal;
          setAcceptedProposal(proposalData);
          
          // Initialize session timer
          const sessionDateTime = new Date(`${proposalData.date}T${proposalData.time}`);
          console.log('Initializing session timer for accepted proposal:', proposalData);
          console.log('Session date time:', sessionDateTime);
          
          const timerData = {
            startTime: sessionDateTime.getTime(),
            duration: parseInt(proposalData.duration) * 60, // Convert minutes to seconds
            remaining: parseInt(proposalData.duration) * 60,
            isActive: false
          };
          
          console.log('Setting session timer data:', timerData);
          setSessionTimer(timerData);
        }
        
        setPendingProposal(null);
      });
      
      // Listen for session end notifications
      socket.on("session:end", (data) => {
        console.log('=== SESSION END NOTIFICATION RECEIVED ===');
        console.log('Data received:', data);
        
        // Clear the session timer
        setSessionTimer(null);
        
        // Add system message to chat
        const endMessage = {
          id: Date.now() + Math.random(),
          sender_id: 'system',
          sender: { first_name: 'System', last_name: '' },
          message: `Session has been ended by ${data.endedBy.first_name} ${data.endedBy.last_name}.`,
          created_at: new Date(),
          message_type: 'system'
        };
        
        setMessages(prev => [...prev, endMessage]);
        
        // Clear accepted proposal
        setAcceptedProposal(null);
      });
      
      // Listen for session created notifications
      socket.on("session:created", (data) => {
        console.log('=== SESSION CREATED NOTIFICATION RECEIVED ===');
        console.log('Data received:', data);
        
        // Add system message to chat
        const createdMessage = {
          id: Date.now() + Math.random(),
          sender_id: 'system',
          sender: { first_name: 'System', last_name: '' },
          message: `Session has been scheduled for ${new Date(data.sessionData.scheduled_at).toLocaleString()}`,
          created_at: new Date(),
          message_type: 'system'
        };
        
        setMessages(prev => [...prev, createdMessage]);
        
        // Emit event to refresh sessions in dashboard
        window.dispatchEvent(new CustomEvent('session-created', { detail: data }));
      });
      
      // Listen for session complete notifications
      socket.on("session:complete", (data) => {
        console.log('=== SESSION COMPLETE NOTIFICATION RECEIVED ===');
        console.log('Data received:', data);
        console.log('Current user type:', userType);
        console.log('Current user:', user);
        console.log('Session timer before clearing:', sessionTimer);
        
        // Clear the session timer
        setSessionTimer(null);
        
        // Add system message to chat
        const completeMessage = {
          id: Date.now() + Math.random(),
          sender_id: 'system',
          sender: { first_name: 'System', last_name: '' },
          message: `Session has been marked as completed by ${data.completedBy.first_name} ${data.completedBy.last_name}.`,
          created_at: new Date(),
          message_type: 'system'
        };
        
        setMessages(prev => [...prev, completeMessage]);
        
        // Clear accepted proposal
        setAcceptedProposal(null);
        
        // Show rating modal only to learner
        console.log('Checking if user is learner to show rating modal');
        console.log('User type is learner:', userType === 'learner');
        if (userType === 'learner') {
          console.log('Showing rating modal to learner');
          setShowRatingModal(true);
        } else {
          console.log('User is not learner, not showing rating modal. User type:', userType);
        }
      });

      // Listen for user joined events
      socket.on("user:joined", (data) => {
        console.log('=== USER JOINED EVENT ===');
        console.log('User joined data:', data);
        console.log('Current user email:', user.email);
        
        const { email } = data;
        if (email !== user.email) {
          console.log('Adding system message for user join');
          // Add a system message that the other user joined
          setMessages(prev => [...prev, {
            id: Date.now() + Math.random(),
            sender_id: 'system',
            sender: { first_name: 'System', last_name: '' },
            message: `${otherUser.first_name} ${otherUser.last_name} joined the chat`,
            created_at: new Date(),
            message_type: 'system'
          }]);
        }
      });
      
      // Listen for room join confirmation
      socket.on("room:join", (data) => {
        console.log('=== ROOM JOIN CONFIRMATION ===');
        console.log('Room join confirmed:', data);
      });
    }

    // Clean up event listeners
    return () => {
      if (socket) {
        socket.off("chat:message");
        socket.off("session:propose");
        socket.off("session:response");
        socket.off("session:complete");
        socket.off("session:end");
        socket.off("session:created");
        socket.off("user:joined");
        socket.off("room:join");
      }
    };
  }, [socket, chatRoomId, user, otherUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    console.log('Sending message:', newMessage);
    console.log('Room ID:', chatRoomId);
    
    // Send message through WebRTC signaling
    socket.emit("chat:message", {
      room: chatRoomId,
      email: user.email,
      message: newMessage,
      timestamp: new Date().toISOString()
    });

    // Add message to local state immediately
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      sender_id: user.id,
      sender: user,
      message: newMessage,
      created_at: new Date(),
      message_type: 'text'
    }]);

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
    socket.emit("session:propose", proposalData);

    // Add proposal to local messages
    const proposalMessage = {
      id: Date.now() + Math.random(),
      sender_id: user.id,
      sender: user,
      message: `Proposed session: ${sessionProposal.topic} on ${sessionProposal.date} at ${sessionProposal.time} for ${sessionProposal.duration} minutes`,
      created_at: new Date(),
      message_type: 'proposal',
      metadata: { proposal: sessionProposal }
    };
    
    setMessages(prev => [...prev, proposalMessage]);
    
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
    socket.emit("session:response", {
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
    const responseMessage = {
      id: Date.now() + Math.random(),
      sender_id: user.id,
      sender: user,
      message: `Session ${response}`,
      created_at: new Date(),
      message_type: 'system'
    };
    
    setMessages(prev => [...prev, responseMessage]);
    
    // If accepted, notify parent component and set state for join button
    if (response === 'accepted') {
      onSessionAccepted && onSessionAccepted({
        meetingLink: 'https://meet.jit.si/blocklearn-session-room',
        jitsiRoomName: 'blocklearn-session-room'
      });
      // Set state to show join button
      setAcceptedProposal(pendingProposal.proposal);
      
      // Create session in database when proposal is accepted
      createSessionInDatabase(pendingProposal.proposal);
    }
    
    setPendingProposal(null);
  };

  // Function to create session in database
  const createSessionInDatabase = async (proposal) => {
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
        socket.emit("session:created", { 
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

  const handleJoinSession = () => {
    if (acceptedProposal && onJoinSession) {
      // Different URLs for mentor and learner
      if (userType === 'mentor') {
        // Mentor redirects to moderated Jitsi room
        window.location.href = 'https://moderated.jitsi.net/0057029a7d5e40fdbae508b18d54bf4f62211d016bd64f9ca248d87870717703';
      } else {
        // Learner joins regular Jitsi room
        window.open('https://meet.jit.si/moderated/b8692948b1e6f09ab6451591d304e8794c73fdaa72a0911c75591a461daa476b', '_blank');
      }
      
      // Also notify parent component
      onJoinSession({
        meetingLink: userType === 'mentor' 
          ? 'https://moderated.jitsi.net/0057029a7d5e40fdbae508b18d54bf4f62211d016bd64f9ca248d87870717703'
          : 'https://meet.jit.si/moderated/b8692948b1e6f09ab6451591d304e8794c73fdaa72a0911c75591a461daa476b',
        jitsiRoomName: userType === 'mentor' 
          ? '0057029a7d5e40fdbae508b18d54bf4f62211d016bd64f9ca248d87870717703'
          : 'b8692948b1e6f09ab6451591d304e8794c73fdaa72a0911c75591a461daa476b'
      });
    }
  };

  const handleEndSession = () => {
    // Send end session notification to other user
    if (socket) {
      socket.emit("session:end", {
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
    const endMessage = {
      id: Date.now() + Math.random(),
      sender_id: 'system',
      sender: { first_name: 'System', last_name: '' },
      message: 'Session has been ended by the mentor.',
      created_at: new Date(),
      message_type: 'system'
    };
    
    setMessages(prev => [...prev, endMessage]);
    
    // Clear accepted proposal
    setAcceptedProposal(null);
  };

  const handleCompleteSession = async () => {
    console.log('=== HANDLE COMPLETE SESSION CALLED ===');
    console.log('User type:', userType);
    console.log('Socket available:', !!socket);
    console.log('Chat room ID:', chatRoomId);
    console.log('Session timer:', sessionTimer);
    console.log('Session timer is active:', sessionTimer?.isActive);
    
    // Send complete session notification to other user
    if (socket) {
      console.log('Sending session:complete event to room:', chatRoomId);
      socket.emit("session:complete", {
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
    const completeMessage = {
      id: Date.now() + Math.random(),
      sender_id: 'system',
      sender: { first_name: 'System', last_name: '' },
      message: 'Session has been marked as completed.',
      created_at: new Date(),
      message_type: 'system'
    };
    
    setMessages(prev => [...prev, completeMessage]);
    
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
      const ratingMessage = {
        id: Date.now() + Math.random(),
        sender_id: 'system',
        sender: { first_name: 'System', last_name: '' },
        message: `Thank you for your feedback! You rated this session ${rating} stars.`,
        created_at: new Date(),
        message_type: 'system'
      };
      
      setMessages(prev => [...prev, ratingMessage]);
      
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
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900/50">
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
                <div ref={messagesEndRef} />
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