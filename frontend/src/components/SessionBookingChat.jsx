import React, { useState, useEffect, useRef } from 'react';
import { Send, Calendar, Video, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { 
  getSessionRequestMessages, 
  sendSessionRequestMessage, 
  proposeSessionTime, 
  respondToProposal, 
  getSessionRequestJitsiLink 
} from '../api';
import WebRTCChat from './WebRTCChat';

const SessionBookingChat = ({ user, otherUser, userType, sessionId, onSessionInitiated, onSessionAccepted, onJoinSession }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    date: '',
    time: '',
    duration: '60',
    topic: ''
  });
  const messagesEndRef = useRef(null);
  
  // Check if sessionId is a temporary placeholder
  const isTemporarySession = sessionId && sessionId.startsWith('temp_');

  // Use WebRTC chat if there's no valid session ID
  const useWebRTCChat = !sessionId || isTemporarySession;

  // Load messages when component mounts or sessionId changes
  useEffect(() => {
    if (sessionId && !isTemporarySession && !useWebRTCChat) {
      loadMessages();
    } else if (isTemporarySession) {
      // Load mock messages for temporary sessions
      loadMockMessages();
    }
  }, [sessionId, isTemporarySession, useWebRTCChat]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMockMessages = () => {
    // Load mock messages for temporary sessions
    const mockMessages = [
      {
        id: 1,
        sender_id: otherUser.id,
        sender: otherUser,
        message: `Hi ${user.first_name}, I'm looking forward to our session!`,
        created_at: new Date(Date.now() - 3600000),
        message_type: 'text'
      },
      {
        id: 2,
        sender_id: user.id,
        sender: user,
        message: `Hello ${otherUser.first_name}! I'm excited too. When would you like to schedule our session?`,
        created_at: new Date(Date.now() - 1800000),
        message_type: 'text'
      }
    ];
    setMessages(mockMessages);
  };

  const loadMessages = async () => {
    if (!sessionId || isTemporarySession) return;
    
    try {
      setLoading(true);
      const response = await getSessionRequestMessages(sessionId);
      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to mock messages if API fails
      loadMockMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (isTemporarySession) {
      // Handle message sending for temporary sessions with mock data
      const newMsg = {
        id: messages.length + 1,
        sender_id: user.id,
        sender: user,
        message: newMessage,
        created_at: new Date(),
        message_type: 'text'
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      return;
    }

    if (!sessionId) return;

    try {
      const response = await sendSessionRequestMessage(sessionId, newMessage);

      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to local update if API fails
      const newMsg = {
        id: messages.length + 1,
        sender_id: user.id,
        sender: user,
        message: newMessage,
        created_at: new Date(),
        message_type: 'text'
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    }
  };

  const handleInitiateSession = () => {
    setShowSessionForm(true);
  };

  const handleSessionFormChange = (e) => {
    const { name, value } = e.target;
    setSessionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProposeSession = async (e) => {
    e.preventDefault();
    
    if (isTemporarySession) {
      // Handle session proposal for temporary sessions with mock data
      const proposalMessage = {
        id: messages.length + 1,
        sender_id: user.id,
        sender: user,
        message: `Proposed a session on ${sessionForm.topic} for ${sessionForm.date} at ${sessionForm.time} (${sessionForm.duration} minutes)`,
        created_at: new Date(),
        message_type: 'proposal',
        metadata: { 
          proposal_id: `temp_proposal_${Date.now()}`,
          temp: true
        }
      };
      
      setMessages(prev => [...prev, proposalMessage]);
      setShowSessionForm(false);
      setSessionForm({
        date: '',
        time: '',
        duration: '60',
        topic: ''
      });
      
      // Notify parent component
      onSessionInitiated && onSessionInitiated({
        date: sessionForm.date,
        time: sessionForm.time,
        duration: sessionForm.duration,
        topic: sessionForm.topic,
        proposer: userType
      });
      return;
    }

    if (!sessionId) return;
    
    try {
      const dateTime = new Date(`${sessionForm.date}T${sessionForm.time}`);
      
      const response = await proposeSessionTime(sessionId, dateTime.toISOString());

      if (response.success) {
        // Refresh messages to show the new proposal
        loadMessages();
        setShowSessionForm(false);
        setSessionForm({
          date: '',
          time: '',
          duration: '60',
          topic: ''
        });
        
        // Notify parent component
        onSessionInitiated && onSessionInitiated({
          date: sessionForm.date,
          time: sessionForm.time,
          duration: sessionForm.duration,
          topic: sessionForm.topic,
          proposer: userType
        });
      }
    } catch (error) {
      console.error('Error proposing session:', error);
    }
  };

  const handleProposalResponse = async (proposalId, response) => {
    if (isTemporarySession) {
      // Handle proposal response for temporary sessions with mock data
      const responseMessage = {
        id: messages.length + 1,
        sender_id: user.id,
        sender: user,
        message: `Proposal ${response}`,
        created_at: new Date(),
        message_type: 'system'
      };
      
      setMessages(prev => [...prev, responseMessage]);
      
      // If accepted, notify parent component
      if (response === 'accepted') {
        onSessionAccepted && onSessionAccepted({
          meetingLink: 'https://meet.jit.si/blocklearn-temp-room',
          jitsiRoomName: 'blocklearn-temp-room'
        });
      }
      return;
    }

    if (!sessionId) return;
    
    try {
      const result = await respondToProposal(sessionId, proposalId, response);

      if (result.success) {
        // Refresh messages to show the response
        loadMessages();
        
        // If accepted, notify parent component
        if (response === 'accepted') {
          // Get the Jitsi link
          try {
            const jitsiResponse = await getSessionRequestJitsiLink(sessionId);
            if (jitsiResponse.success) {
              onSessionAccepted && onSessionAccepted({
                meetingLink: jitsiResponse.data.meeting_link,
                jitsiRoomName: jitsiResponse.data.jitsi_room_name
              });
            }
          } catch (error) {
            console.error('Error getting Jitsi link:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error responding to proposal:', error);
    }
  };

  const handleJoinVideoCall = async () => {
    if (isTemporarySession) {
      // Handle join video call for temporary sessions
      onJoinSession && onJoinSession('https://meet.jit.si/blocklearn-temp-room');
      return;
    }

    if (!sessionId) return;
    
    try {
      const response = await getSessionRequestJitsiLink(sessionId);
      if (response.success) {
        onJoinSession && onJoinSession(response.data.meeting_link);
      }
    } catch (error) {
      console.error('Error getting Jitsi link:', error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    // Use WebRTC chat if there's no valid session ID
    useWebRTCChat ? (
      <WebRTCChat
        user={user}
        otherUser={otherUser}
        userType={userType}
        sessionId={sessionId}
        onSessionInitiated={onSessionInitiated}
        onSessionAccepted={onSessionAccepted}
        onJoinSession={onJoinSession}
      />
    ) : (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-primary dark:bg-primary/90 p-4">
        <div className="flex items-center justify-between">
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
          <button
            onClick={() => handleInitiateSession()}
            className="flex items-center px-3 py-1 bg-white text-primary rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Propose Session
          </button>
        </div>
      </div>

      {/* Chat Messages */}
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
                        : message.message_type === 'system' || message.message_type === 'jitsi_link'
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
                    {message.message_type === 'jitsi_link' ? (
                      <div className="text-sm">
                        <p className="mb-2">{message.message}</p>
                        <button
                          onClick={() => window.open(message.metadata?.meeting_link, '_blank')}
                          className="flex items-center px-3 py-1 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Join Video Call
                        </button>
                      </div>
                    ) : message.message_type === 'proposal' ? (
                      <div className="text-sm">
                        <p className="mb-2">{message.message}</p>
                        {message.metadata?.proposal_id && message.sender_id !== user.id && (
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={() => handleProposalResponse(message.metadata.proposal_id, 'accepted')}
                              className="flex items-center px-2 py-1 bg-green-500 text-white rounded-md text-xs font-medium hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleProposalResponse(message.metadata.proposal_id, 'rejected')}
                              className="flex items-center px-2 py-1 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Request Change
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    )}
                    <p className={`text-xs mt-1 ${
                      isCurrentUser 
                        ? 'text-primary-100' 
                        : message.message_type === 'system' || message.message_type === 'jitsi_link'
                          ? 'text-blue-600 dark:text-blue-300'
                          : message.message_type === 'proposal'
                            ? 'text-yellow-600 dark:text-yellow-300'
                            : 'text-gray-500 dark:text-slate-400'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Session Proposal Form */}
      {showSessionForm && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/50">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Propose Session Details
          </h4>
          <form onSubmit={handleProposeSession} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={sessionForm.date}
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
                  value={sessionForm.time}
                  onChange={handleSessionFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Duration (minutes)
              </label>
              <select
                name="duration"
                value={sessionForm.duration}
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
                value={sessionForm.topic}
                onChange={handleSessionFormChange}
                placeholder="What topic would you like to cover?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowSessionForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Propose Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Message Input */}
      {!showSessionForm && (
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
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
      )}
    </div>
    ) // Close the conditional rendering
  );
};

export default SessionBookingChat;