import React, { useState, useEffect, useRef } from 'react';
import { Send, Calendar, Video, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../api';

const SessionRequestChat = ({ sessionRequest, currentUser, onSessionScheduled }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [proposedTimes, setProposedTimes] = useState([]);
  const messagesEndRef = useRef(null);

  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, [sessionRequest.id]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/session-requests/${sessionRequest.id}/messages`);
      if (response.data.success) {
        setMessages(response.data.data);
        // Extract proposed times from messages
        const proposals = response.data.data
          .filter(msg => msg.message_type === 'proposal')
          .map(msg => ({
            id: msg.metadata?.proposal_id,
            time: msg.message.replace('Proposed a session time: ', ''),
            status: 'pending'
          }));
        setProposedTimes(proposals);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await api.post(`/api/session-requests/${sessionRequest.id}/messages`, {
        message: newMessage
      });

      if (response.data.success) {
        setMessages(prev => [...prev, response.data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleProposeTime = async (e) => {
    e.preventDefault();
    const timeInput = e.target.elements.proposedTime.value;
    if (!timeInput) return;

    try {
      const response = await api.post(`/api/session-requests/${sessionRequest.id}/proposetimes`, {
        proposedTime: timeInput
      });

      if (response.data.success) {
        // Refresh messages to show the new proposal
        loadMessages();
        e.target.reset();
      }
    } catch (error) {
      console.error('Error proposing time:', error);
    }
  };

  const handleProposalResponse = async (proposalId, response) => {
    try {
      const result = await api.post(`/api/session-requests/${sessionRequest.id}/proposetimes/${proposalId}/respond`, {
        response: response
      });

      if (result.data.success) {
        // Refresh messages to show the response
        loadMessages();
        
        // If accepted, notify parent component
        if (response === 'accepted') {
          // Get the Jitsi link
          try {
            const jitsiResponse = await api.get(`/api/session-requests/${sessionRequest.id}/jitsilink`);
            if (jitsiResponse.data.success) {
              onSessionScheduled && onSessionScheduled({
                meetingLink: jitsiResponse.data.data.meeting_link,
                jitsiRoomName: jitsiResponse.data.data.jitsi_room_name
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
    try {
      const response = await api.get(`/api/session-requests/${sessionRequest.id}/jitsilink`);
      if (response.data.success) {
        window.open(response.data.data.meeting_link, '_blank');
      }
    } catch (error) {
      console.error('Error getting Jitsi link:', error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-primary dark:bg-primary/90 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Session Request: {sessionRequest.skill.name}
            </h3>
            <p className="text-primary-100 text-sm">
              with {sessionRequest.mentor.first_name} {sessionRequest.mentor.last_name}
            </p>
          </div>
          {sessionRequest.status === 'scheduled' && (
            <button
              onClick={handleJoinVideoCall}
              className="flex items-center px-3 py-1 bg-white text-primary rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Video className="w-4 h-4 mr-1" />
              Join Call
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900/50">
        {messages.map((message) => {
          const isCurrentUser = message.sender_id === currentUser.id;
          
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
      </div>

      {/* Proposed Times */}
      {proposedTimes.length > 0 && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/50">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Proposed Times
          </h4>
          <div className="space-y-3">
            {proposedTimes.map((proposal) => {
              // Find the full proposal data from messages
              const proposalMessage = messages.find(
                msg => msg.message_type === 'proposal' && msg.metadata?.proposal_id === proposal.id
              );
              
              if (!proposalMessage) return null;
              
              const isCurrentUserProposer = proposalMessage.sender_id === currentUser.id;
              const canRespond = !isCurrentUserProposer && proposal.status === 'pending';
              
              return (
                <div 
                  key={proposal.id} 
                  className="p-3 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {proposal.time}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        Proposed by {proposalMessage.sender.first_name} {proposalMessage.sender.last_name}
                        {isCurrentUserProposer && ' (You)'}
                      </p>
                    </div>
                    {proposal.status === 'pending' && canRespond && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleProposalResponse(proposal.id, 'accepted')}
                          className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Accept"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleProposalResponse(proposal.id, 'rejected')}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isCurrentUserProposer && proposal.status === 'pending' && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                      Waiting for response
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
        {/* Time Proposal Form */}
        <div className="mb-3">
          <form onSubmit={handleProposeTime} className="flex items-center">
            <input
              type="datetime-local"
              name="proposedTime"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              placeholder="Propose a time"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary/90 transition-colors text-sm"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </form>
        </div>
        
        {/* Text Message Input */}
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

export default SessionRequestChat;