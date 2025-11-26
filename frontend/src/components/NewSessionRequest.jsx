import React, { useState, useEffect } from 'react';
import { User, BookOpen, Send } from 'lucide-react';
import api from '../api';

const NewSessionRequest = ({ mentor, skill, onSessionRequestCreated }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setLoading(true);
      const response = await api.post('/api/session-requests', {
        mentorId: mentor.id,
        skillId: skill.id,
        initialMessage: message
      });

      if (response.data.success) {
        onSessionRequestCreated && onSessionRequestCreated(response.data.data);
        setMessage('');
      }
    } catch (error) {
      console.error('Error creating session request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Request Session</h3>
      
      <div className="flex items-center mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <div className="bg-primary/10 p-2 rounded-lg">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {mentor.first_name} {mentor.last_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Mentor
          </p>
        </div>
      </div>
      
      <div className="flex items-center mb-6 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <div className="bg-primary/10 p-2 rounded-lg">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {skill.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Skill
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Message
          </label>
          <textarea
            id="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce yourself and explain what you'd like to learn..."
            className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Request
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default NewSessionRequest;