import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';
import SessionRequestChat from '../components/SessionRequestChat';

const SessionRequests = () => {
  const [sessionRequests, setSessionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionScheduled, setSessionScheduled] = useState(false);
  const [scheduledSessionData, setScheduledSessionData] = useState(null);
  const navigate = useNavigate();

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
    
    loadSessionRequests();
  }, []);

  const loadSessionRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/session-requests');
      if (response.data.success) {
        setSessionRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error loading session requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSessionRequest = async (mentorId, skillId, initialMessage) => {
    try {
      const response = await api.post('/api/session-requests', {
        mentorId,
        skillId,
        initialMessage
      });
      
      if (response.data.success) {
        // Refresh the session requests list
        loadSessionRequests();
        return response.data.data;
      }
    } catch (error) {
      console.error('Error creating session request:', error);
    }
  };

  const handleSessionScheduled = (data) => {
    setSessionScheduled(true);
    setScheduledSessionData(data);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sessionScheduled) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">Session Scheduled Successfully!</h3>
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              Your session has been scheduled and the video call link is ready.
            </p>
            <div className="mt-6 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Session Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Meeting Link:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    <a 
                      href={scheduledSessionData?.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Join Video Call
                    </a>
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={() => {
                  setSessionScheduled(false);
                  setScheduledSessionData(null);
                  loadSessionRequests();
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none"
              >
                Back to Requests
              </button>
              <button
                onClick={() => window.open(scheduledSessionData?.meetingLink, '_blank')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:hover:bg-slate-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Join Video Call Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setSelectedRequest(null)}
              className="flex items-center text-primary hover:text-primary/80 mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Session Requests
            </button>
          </div>
          
          <div className="h-[calc(100vh-200px)]">
            {currentUser && (
              <SessionRequestChat 
                sessionRequest={selectedRequest}
                currentUser={currentUser}
                onSessionScheduled={handleSessionScheduled}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session Requests</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Manage your session requests and communicate with mentors through chat
          </p>
        </div>

        {sessionRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No session requests</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Get started by creating a new session request with a mentor.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/match')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none"
              >
                Find Mentors
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {sessionRequests.map((request) => {
                const isStudent = currentUser?.id === request.student.id;
                const otherUser = isStudent ? request.mentor : request.student;
                
                return (
                  <div 
                    key={request.id} 
                    className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {request.skill.name}
                          </h3>
                          <p className="text-gray-600 dark:text-slate-400">
                            with {otherUser.first_name} {otherUser.last_name}
                          </p>
                          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-slate-400">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                            <span className="mx-2">•</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionRequests;