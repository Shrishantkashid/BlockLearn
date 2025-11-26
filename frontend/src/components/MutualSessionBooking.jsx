import React, { useState, useEffect, useRef } from 'react';
import { Send, Calendar, Clock, MapPin, MessageSquare, User, CheckCircle, Bell, Video } from 'lucide-react';
import api from '../api';
import { io } from 'socket.io-client';

const MutualSessionBooking = ({ sessionId, mentor, student, skill, currentUser, onSessionScheduled }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'system',
      text: `Welcome to the session booking page for ${skill.name} with ${mentor.first_name} ${mentor.last_name}. Both mentor and learner can propose session times and discuss details here. When a time is proposed, the other user can accept or reject it.`,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [proposedTimes, setProposedTimes] = useState([]);
  const [notification, setNotification] = useState(null);
  const [jitsiLink, setJitsiLink] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    // Create a unique room ID based on the session ID
    const roomId = sessionId || `session_${mentor.id}_${student.id}_${skill.id}`;
    
    console.log('Joining room:', roomId);
    console.log('Current user:', currentUser);
    console.log('Mentor:', mentor);
    console.log('Student:', student);
    console.log('Skill:', skill);
    
    // Connect to the signaling server
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
      path: '/socket.io',
      upgrade: false,
      rememberUpgrade: false
    });

    // Handle connection
    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.IO server with ID:', socketRef.current.id);
      console.log('Joining room with ID:', roomId);
      // Join the session room
      socketRef.current.emit('join-room', roomId);
    });

    // Handle connection error
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Handle disconnect
    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Handle incoming messages
    socketRef.current.on('message', (data) => {
      console.log('Received message:', data);
      const message = {
        id: messages.length + 1,
        sender: data.senderType, // 'mentor' or 'learner'
        senderName: data.senderType === 'mentor' 
          ? `${mentor.first_name} ${mentor.last_name}` 
          : `${student.first_name} ${student.last_name}`,
        text: data.message,
        timestamp: new Date(data.timestamp)
      };
      
      setMessages(prev => [...prev, message]);
    });

    // Handle proposed times
    socketRef.current.on('propose-time', (data) => {
      console.log('Received proposed time:', data);
      const proposal = {
        id: proposedTimes.length + 1,
        proposer: data.proposerType, // 'mentor' or 'learner'
        proposerName: data.proposerType === 'mentor' 
          ? `${mentor.first_name} ${mentor.last_name}` 
          : `${student.first_name} ${student.last_name}`,
        dateTime: data.dateTime,
        timestamp: new Date(data.timestamp),
        status: 'pending' // pending, accepted, rejected
      };
      
      setProposedTimes(prev => [...prev, proposal]);
      
      // Add system message
      const message = {
        id: messages.length + 1,
        sender: 'system',
        text: `${proposal.proposerName} proposed a session time: ${new Date(data.dateTime).toLocaleString()}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
    });

    // Handle proposal response
    socketRef.current.on('proposal-response', (data) => {
      console.log('Received proposal response:', data);
      // Update the proposal status
      setProposedTimes(prev => prev.map(proposal => 
        proposal.id === data.proposalId 
          ? {...proposal, status: data.response} 
          : proposal
      ));
      
      // Add system message
      const responderName = data.responderType === 'mentor' 
        ? `${mentor.first_name} ${mentor.last_name}` 
        : `${student.first_name} ${student.last_name}`;
      
      const message = {
        id: messages.length + 1,
        sender: 'system',
        text: `${responderName} ${data.response} the proposed time: ${new Date(data.dateTime).toLocaleString()}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
    });

    // Handle session scheduled event
    socketRef.current.on('session-scheduled', (data) => {
      console.log('Session scheduled event received:', data);
      // Add confirmation message to chat with video call details
      let confirmationMessage = `Session scheduled for ${new Date(data.scheduled_at).toLocaleString()} (${data.duration_minutes} minutes) at ${data.location || 'Online'}.`;
      
      // Add video call details if available
      if (data.live_session_code) {
        confirmationMessage += `\n\nVideo Call Room Code: ${data.live_session_code}\nMeeting Link: ${data.meeting_link}`;
      }
      
      const confirmationMessageObj = {
        id: messages.length + 1,
        sender: 'system',
        text: confirmationMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, confirmationMessageObj]);
      setShowForm(false);
      
      // Notify parent component that session was scheduled
      if (onSessionScheduled) {
        onSessionScheduled(data);
      }
    });

    // Handle Jitsi link event
    socketRef.current.on('jitsi-link', (data) => {
      console.log('Jitsi link received:', data);
      setJitsiLink(data.meetingLink);
      
      // Add Jitsi link message to chat
      const jitsiMessage = {
        id: messages.length + 1,
        sender: 'system',
        text: `Join your video call: ${data.meetingLink}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, jitsiMessage]);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', roomId);
        socketRef.current.disconnect();
      }
    };
  }, [sessionId, mentor, student, messages.length, proposedTimes.length, onSessionScheduled]);

  // Show notification when a new message is received from the other user
  useEffect(() => {
    if (messages.length > 1) { // More than the initial welcome message
      const lastMessage = messages[messages.length - 1];
      // Only show notification for user messages, not system messages
      // And only show notification if the message is from the other user (not the current user)
      if (lastMessage.sender !== 'system' && lastMessage.sender !== (currentUser.id === mentor.id ? 'mentor' : 'learner')) {
        const senderName = lastMessage.sender === 'mentor' 
          ? `${mentor.first_name} ${mentor.last_name}` 
          : `${student.first_name} ${student.last_name}`;
        
        showNotification(`${senderName} sent a message`);
      }
    }
  }, [messages]);

  const showNotification = (message) => {
    setNotification(message);
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Create a unique room ID based on the session ID
    const roomId = sessionId || `session_${mentor.id}_${student.id}_${skill.id}`;
    
    // Determine sender type
    const senderType = currentUser.id === mentor.id ? 'mentor' : 'learner';
    
    // Create message object
    const messageData = {
      message: newMessage,
      senderType: senderType,
      roomId: roomId, // Use the deterministic room ID
      timestamp: new Date().toISOString()
    };

    // Add to local state immediately for responsive UI
    const message = {
      id: messages.length + 1,
      sender: senderType,
      senderName: senderType === 'mentor' 
        ? `${mentor.first_name} ${mentor.last_name}` 
        : `${student.first_name} ${student.last_name}`,
      text: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Send message through socket
    if (socketRef.current) {
      socketRef.current.emit('message', messageData);
    }
  };

  const handleProposeTime = (dateTime) => {
    // Create a unique room ID based on the session ID
    const roomId = sessionId || `session_${mentor.id}_${student.id}_${skill.id}`;
    
    // Determine proposer type
    const proposerType = currentUser.id === mentor.id ? 'mentor' : 'learner';
    
    // Create proposal object
    const proposalData = {
      proposerType: proposerType,
      dateTime: dateTime,
      roomId: roomId, // Use the deterministic room ID
      timestamp: new Date().toISOString()
    };

    // Add to local state immediately for responsive UI
    const proposal = {
      id: proposedTimes.length + 1,
      proposer: proposerType,
      proposerName: proposerType === 'mentor' 
        ? `${mentor.first_name} ${mentor.last_name}` 
        : `${student.first_name} ${student.last_name}`,
      dateTime: dateTime,
      timestamp: new Date(),
      status: 'pending'
    };

    setProposedTimes(prev => [...prev, proposal]);
    
    // Add message to chat
    const message = {
      id: messages.length + 1,
      sender: 'system',
      text: `${proposal.proposerName} proposed a session time: ${new Date(dateTime).toLocaleString()}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);

    // Send proposal through socket
    if (socketRef.current) {
      socketRef.current.emit('propose-time', proposalData);
    }
  };

  const handleProposalResponse = (proposalId, response) => {
    // Create a unique room ID based on the session ID
    const roomId = sessionId || `session_${mentor.id}_${student.id}_${skill.id}`;
    
    // Determine responder type
    const responderType = currentUser.id === mentor.id ? 'mentor' : 'learner';
    
    // Find the proposal to get the dateTime
    const proposal = proposedTimes.find(p => p.id === proposalId);
    if (!proposal) return;
    
    // Prevent the proposer from responding to their own proposal
    const isCurrentUserProposer = proposal.proposer === 'mentor' 
      ? currentUser.id === mentor.id 
      : currentUser.id === student.id;
      
    if (isCurrentUserProposer) {
      console.log("Cannot respond to your own proposal");
      return;
    }
    
    // Create response object
    const responseData = {
      proposalId: proposalId,
      response: response, // 'accepted' or 'rejected'
      responderType: responderType,
      dateTime: proposal.dateTime,
      roomId: roomId, // Use the deterministic room ID
      timestamp: new Date().toISOString()
    };

    // Update local state immediately
    setProposedTimes(prev => prev.map(p => 
      p.id === proposalId 
        ? {...p, status: response} 
        : p
    ));

    // If the proposal is accepted, automatically schedule the session
    if (response === 'accepted') {
      // Automatically schedule the session with default values
      autoScheduleSession(proposal.dateTime);
    }

    // Send response through socket
    if (socketRef.current) {
      socketRef.current.emit('proposal-response', responseData);
    }
  };

  const autoScheduleSession = async (scheduledDateTime) => {
    try {
      // Create a unique room ID based on the session ID
      const roomId = sessionId || `session_${mentor.id}_${student.id}_${skill.id}`;
      
      // Format the datetime for better compatibility
      // Use ISO format without milliseconds and timezone for better compatibility
      const scheduledDate = new Date(scheduledDateTime);
      const formattedScheduledAt = scheduledDate.toISOString().slice(0, 19).replace('T', ' ');
      
      // Send session data to the backend with default values
      const sessionData = {
        student_id: student.id,
        mentor_id: mentor.id,
        skill_id: skill.id,
        scheduled_at: formattedScheduledAt,
        duration_minutes: 60, // Default duration
        location: 'Online',
        notes: `Session automatically scheduled from accepted proposal on ${scheduledDate.toLocaleString()}`
      };

      const response = await api.post('/api/sessions', sessionData);
      
      if (response.data.success) {
        // Generate Jitsi meeting link
        const jitsiRoomName = crypto.randomUUID();
        const meetingLink = `https://meet.jit.si/${jitsiRoomName}`;
        
        // Store the Jitsi link
        setJitsiLink(meetingLink);
        
        // Broadcast Jitsi link through socket
        if (socketRef.current) {
          const jitsiData = {
            meetingLink: meetingLink,
            jitsiRoomName: jitsiRoomName,
            roomId: roomId
          };
          socketRef.current.emit('jitsi-link', jitsiData);
        }
        
        // Broadcast session scheduled event through socket with video call details
        if (socketRef.current) {
          const scheduleData = {
            scheduled_at: formattedScheduledAt,
            duration_minutes: 60,
            location: 'Online',
            notes: `Session automatically scheduled from accepted proposal on ${scheduledDate.toLocaleString()}`,
            roomId: roomId, // Use the deterministic room ID
            live_session_code: response.data.data.live_session_code,
            meeting_link: meetingLink
          };
          socketRef.current.emit('session-scheduled', scheduleData);
        }
      } else {
        console.error('Failed to auto-schedule session:', response.data.message);
      }
    } catch (error) {
      console.error('Error auto-scheduling session:', error);
    }
  };

  const handleJoinVideoCall = () => {
    if (jitsiLink) {
      window.open(jitsiLink, '_blank');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-4 flex items-center animate-fade-in">
            <Bell className="w-5 h-5 text-primary mr-2" />
            <span className="text-gray-900 dark:text-white">{notification}</span>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="bg-primary dark:bg-primary/90 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-white mr-2" />
            <h3 className="text-lg font-semibold text-white">
              Schedule Session: {skill.name}
            </h3>
          </div>
          {jitsiLink && (
            <button
              onClick={handleJoinVideoCall}
              className="flex items-center px-3 py-1 bg-white text-primary rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Video className="w-4 h-4 mr-1" />
              Join Call
            </button>
          )}
        </div>
        <p className="text-primary-100 text-sm mt-1">
          with {mentor.first_name} {mentor.last_name}
        </p>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900/50">
        {messages.map((message) => {
          // Determine if the current user is the sender
          // For system messages, they're neither sender nor receiver in the traditional sense
          const isCurrentUserSender = message.sender === 'system' 
            ? false 
            : currentUser?.id === (message.sender === 'mentor' ? mentor.id : student.id);
          
          return (
            <div 
              key={message.id} 
              className={`mb-4 flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isCurrentUserSender 
                    ? 'bg-primary text-white rounded-br-none' 
                    : message.sender === 'system'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-b-none text-center'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none'
                }`}
              >
                {message.sender !== 'system' && message.senderName && (
                  <p className="text-xs font-medium mb-1">
                    {message.senderName}
                  </p>
                )}
                {message.sender === 'system' ? (
                  <div className="text-sm whitespace-pre-line">
                    {message.text}
                  </div>
                ) : (
                  <p className="text-sm">{message.text}</p>
                )}
                <p className={`text-xs mt-1 ${isCurrentUserSender ? 'text-primary-100' : message.sender === 'system' ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-slate-400'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Proposed Times */}
      {proposedTimes.length > 0 && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/50">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Proposed Times</h4>
          <div className="space-y-3">
            {proposedTimes.map((proposal) => {
              // Determine if current user is the proposer
              const isCurrentUserProposer = proposal.proposer === 'mentor' 
                ? currentUser.id === mentor.id 
                : currentUser.id === student.id;
              
              // Only the receiver (not the proposer) can respond
              const canRespond = !isCurrentUserProposer && proposal.status === 'pending';
              
              return (
                <div 
                  key={proposal.id} 
                  className={`p-4 rounded-lg border ${
                    proposal.status === 'accepted' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : proposal.status === 'rejected'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(proposal.dateTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        Proposed by {proposal.proposerName}
                        {isCurrentUserProposer && ' (You)'}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {proposal.status === 'accepted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                          Accepted
                        </span>
                      )}
                      {proposal.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                          Rejected
                        </span>
                      )}
                      {proposal.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {canRespond && (
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => handleProposalResponse(proposal.id, 'accepted')}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleProposalResponse(proposal.id, 'rejected')}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        No
                      </button>
                    </div>
                  )}
                  
                  {isCurrentUserProposer && proposal.status === 'pending' && (
                    <div className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                      Waiting for response from the other party
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
        <div className="flex items-center mb-2">
          <input
            type="datetime-local"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            onChange={(e) => handleProposeTime(e.target.value)}
            placeholder="Propose a time"
          />
        </div>
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MutualSessionBooking;