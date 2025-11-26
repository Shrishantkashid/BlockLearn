import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, Clock, Video, CheckCircle, AlertCircle, Send, User } from "lucide-react";
import api from "../api";
import FeedbackModal from "../components/FeedbackModal";
import LiveSessionModal from "../components/LiveSessionModal";
import LiveSessionCode from "../components/LiveSessionCode";
import io from 'socket.io-client';

const Sessions = () => {
  const [sessions, setSessions] = useState({
    upcoming: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    sessionId: null,
    userRole: null,
    existingFeedback: null
  });
  const [liveSessionModal, setLiveSessionModal] = useState({
    isOpen: false,
    session: null
  });
  const [generatedLiveSession, setGeneratedLiveSession] = useState(null);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchUserSessions();
    
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    // Listen for session scheduled events
    newSocket.on('session-scheduled', (data) => {
      console.log('Session scheduled event received:', data);
      // Refresh sessions list when a session is scheduled
      fetchUserSessions();
    });
    
    // Listen for session created events from WebRTC chat
    const handleSessionCreated = (event) => {
      console.log('Session created event received:', event.detail);
      // Refresh sessions list when a session is created via WebRTC
      fetchUserSessions();
    };
    
    window.addEventListener('session-created', handleSessionCreated);
    
    // Clean up socket connection and event listener
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      window.removeEventListener('session-created', handleSessionCreated);
    };
  }, []);

  const fetchUserSessions = async () => {
    try {
      const response = await api.get('/api/sessions');
      if (response.data.success) {
        // Separate upcoming and completed sessions
        const upcoming = response.data.data.filter(session => session.status === 'scheduled');
        const completed = response.data.data.filter(session => session.status === 'completed');
        
        setSessions({
          upcoming,
          completed
        });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      // Don't use mock data - show error instead
      setSessions({
        upcoming: [],
        completed: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await api.post('/api/feedback/submit', feedbackData);
      
      if (response.data.success) {
        // Update local state to show feedback was submitted
        setSessions(prev => ({
          ...prev,
          completed: prev.completed.map(session =>
            session.id === feedbackData.session_id
              ? { ...session, hasFeedback: true }
              : session
          )
        }));
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };

  const openFeedbackModal = async (sessionId, userRole) => {
    try {
      // Fetch existing feedback for the session
      const response = await api.get(`/api/feedback/session/${sessionId}`);
      
      if (response.data.success) {
        setFeedbackModal({
          isOpen: true,
          sessionId,
          userRole,
          existingFeedback: response.data.data
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          sessionId,
          userRole,
          existingFeedback: null
        });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setFeedbackModal({
        isOpen: true,
        sessionId,
        userRole,
        existingFeedback: null
      });
    }
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      isOpen: false,
      sessionId: null,
      userRole: null,
      existingFeedback: null
    });
  };

  const openLiveSessionModal = (session) => {
    setLiveSessionModal({
      isOpen: true,
      session
    });
  };

  const closeLiveSessionModal = () => {
    setLiveSessionModal({
      isOpen: false,
      session: null
    });
  };

  const handleLiveSessionCodeGenerated = (liveSessionData) => {
    setGeneratedLiveSession(liveSessionData);
    closeLiveSessionModal();
  };

  const handleJoinLiveSession = (code) => {
    // Navigate to the live session page
    navigate(`/session/live/${code}`);
  };

  const renderSessionCard = (session) => (
    <div key={session.id} className="card">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
            session.status === 'completed'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }`}>
            {session.mentor.first_name?.charAt(0)}{session.mentor.last_name?.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {session.skill?.name || 'Session'}
            </h3>
            <p className="text-gray-600 dark:text-slate-400">with {session.mentor.first_name} {session.mentor.last_name}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-slate-400">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(session.scheduled_at).toLocaleString()}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {session.duration_minutes} minutes
              </span>
            </div>
            {session.live_session_code && (
              <div className="mt-2 text-sm">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  Video Call Code: {session.live_session_code}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          {session.status === 'completed' ? (
            <>
              {session.hasFeedback ? (
                <div className="px-3 py-2 text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  Feedback Submitted
                </div>
              ) : (
                <button
                  onClick={() => openFeedbackModal(session.id, 'student')}
                  className="btn-primary"
                >
                  Give Feedback
                </button>
              )}
            </>
          ) : (
            <>
              {session.live_session_code ? (
                <Link
                  to={`/mentor-student-call?roomId=${session.live_session_code}&userType=student`}
                  className="btn-primary flex items-center"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Video Call
                </Link>
              ) : (
                <button
                  onClick={() => openLiveSessionModal(session)}
                  className="btn-primary flex items-center"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Start Live Session
                </button>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Sessions</h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              View your upcoming and past sessions
            </p>
          </div>
          {/* Removed the "Book New Session" button as per requirement */}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Sessions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Upcoming Sessions
                </h2>
              </div>
              
              {sessions.upcoming.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No upcoming sessions</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    You don't have any upcoming sessions scheduled.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.upcoming.map(renderSessionCard)}
                </div>
              )}
            </div>

            {/* Completed Sessions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Completed Sessions
                </h2>
              </div>
              
              {sessions.completed.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No completed sessions</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    Your completed sessions will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.completed.map(renderSessionCard)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackModal.isOpen && (
          <FeedbackModal
            isOpen={feedbackModal.isOpen}
            onClose={closeFeedbackModal}
            sessionId={feedbackModal.sessionId}
            userRole={feedbackModal.userRole}
            existingFeedback={feedbackModal.existingFeedback}
            onSubmit={handleFeedbackSubmit}
          />
        )}

        {/* Live Session Modal */}
        {liveSessionModal.isOpen && (
          <LiveSessionModal
            isOpen={liveSessionModal.isOpen}
            onClose={closeLiveSessionModal}
            session={liveSessionModal.session}
            onCodeGenerated={handleLiveSessionCodeGenerated}
          />
        )}

        {/* Generated Live Session Code */}
        {generatedLiveSession && (
          <LiveSessionCode
            liveSessionData={generatedLiveSession}
            onJoinSession={handleJoinLiveSession}
            onDismiss={() => setGeneratedLiveSession(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Sessions;