import React, { useState, useEffect, useRef } from 'react';
import { Send, Calendar, Clock, User, MessageCircle } from 'lucide-react';
import api from '../api';

const SessionSchedulingChat = ({ sessionId, mentor, student, skill, onSessionScheduled }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'system',
      text: `Welcome! This chat is for scheduling your session for ${skill.name} with ${mentor.first_name} ${mentor.last_name}. Please discuss timing and availability here.`,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionForm, setSessionForm] = useState({
    scheduled_at: '',
    duration_minutes: 60,
    location: '',
    notes: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [formError, setFormError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: 'learner',
      text: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Auto-response from mentor after a short delay
    setTimeout(() => {
      const autoResponse = {
        id: messages.length + 2,
        sender: 'mentor',
        text: `Thanks for your message! I'm available for this session. Let's schedule it.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, autoResponse]);
      setShowForm(true);
    }, 1000);
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    setScheduling(true);
    setFormError('');

    try {
      // Send session data to the backend
      const sessionData = {
        mentor_id: mentor.id,
        skill_id: skill.id,
        scheduled_at: sessionForm.scheduled_at,
        duration_minutes: sessionForm.duration_minutes,
        location: sessionForm.location,
        notes: sessionForm.notes
      };

      const response = await api.post('/api/sessions', sessionData);
      
      if (response.data.success) {
        // Add confirmation message to chat
        const confirmationMessage = {
          id: messages.length + 3,
          sender: 'system',
          text: `Session scheduled for ${new Date(sessionForm.scheduled_at).toLocaleString()} (${sessionForm.duration_minutes} minutes) at ${sessionForm.location || 'Online'}.`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, confirmationMessage]);
        setShowForm(false);
        
        // Notify parent component that session was scheduled
        if (onSessionScheduled) {
          onSessionScheduled({
            ...sessionForm,
            mentor,
            student,
            skill
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to schedule session');
      }
    } catch (error) {
      setFormError(error.message || 'Failed to schedule session. Please try again.');
      console.error('Error scheduling session:', error);
    } finally {
      setScheduling(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-primary dark:bg-primary/90 p-4">
        <div className="flex items-center">
          <MessageCircle className="w-5 h-5 text-white mr-2" />
          <h3 className="text-lg font-semibold text-white">
            Schedule Session: {skill.name}
          </h3>
        </div>
        <p className="text-primary-100 text-sm mt-1">
          with {mentor.first_name} {mentor.last_name}
        </p>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-900/50">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-4 flex ${message.sender === 'learner' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'learner' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : message.sender === 'mentor'
                    ? 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-b-none'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${message.sender === 'learner' ? 'text-primary-100' : 'text-gray-500 dark:text-slate-400'}`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Session Form */}
      {showForm && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900/50">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Schedule Your Session</h4>
          {formError && (
            <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded">
              {formError}
            </div>
          )}
          <form onSubmit={handleScheduleSession} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={sessionForm.scheduled_at}
                  onChange={(e) => setSessionForm({...sessionForm, scheduled_at: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Duration (minutes)
                </label>
                <select
                  value={sessionForm.duration_minutes}
                  onChange={(e) => setSessionForm({...sessionForm, duration_minutes: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g., Online, Room 201, Zoom link"
                value={sessionForm.location}
                onChange={(e) => setSessionForm({...sessionForm, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                placeholder="Any additional information for the session..."
                value={sessionForm.notes}
                onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-700 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={scheduling}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {scheduling ? 'Scheduling...' : 'Schedule Session'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Message Input */}
      {!showForm && (
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
  );
};

export default SessionSchedulingChat;