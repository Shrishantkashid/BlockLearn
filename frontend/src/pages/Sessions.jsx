import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, Clock, Video, CheckCircle, AlertCircle, Send, User } from "lucide-react";
import api from "../api";
import FeedbackModal from "../components/FeedbackModal";
import LiveSessionModal from "../components/LiveSessionModal";
import LiveSessionCode from "../components/LiveSessionCode";
import SessionSchedulingChat from "../components/SessionSchedulingChat";

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
  const [showSchedulingChat, setShowSchedulingChat] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [preSelectedMentor, setPreSelectedMentor] = useState(null);
  const [preSelectedSkill, setPreSelectedSkill] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserSessions();
    
    // Check if there's a pre-selected mentor from navigation state
    // In a real implementation, this would come from navigation state
    // For now, we'll just show the scheduling section by default if there are no sessions
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

  const handleScheduleWithMentor = (mentor, skill) => {
    setSelectedMentor(mentor);
    setSelectedSkill(skill);
    setShowSchedulingChat(true);
  };

  const handleSessionScheduled = (sessionData) => {
    // Refresh sessions list
    fetchUserSessions();
    // Close chat
    setShowSchedulingChat(false);
    // Reset selection
    setSelectedMentor(null);
    setSelectedSkill(null);
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
              <button
                onClick={() => openLiveSessionModal(session)}
                className="btn-primary flex items-center"
              >
                <Video className="w-4 h-4 mr-2" />
                Start Live Session
              </button>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Sessions</h1>
          <p className="text-gray-600 dark:text-slate-400">
            Manage your upcoming and completed learning sessions
          </p>
        </div>

        {showSchedulingChat && selectedMentor && selectedSkill && (
          <div className="mb-8">
            <SessionSchedulingChat
              mentor={selectedMentor}
              student={{}} // Will be filled from auth context
              skill={selectedSkill}
              onSessionScheduled={handleSessionScheduled}
            />
          </div>
        )}

        {generatedLiveSession && (
          <div className="mb-8">
            <LiveSessionCode 
              liveSessionData={generatedLiveSession} 
              onJoinSession={handleJoinLiveSession}
            />
          </div>
        )}

        <div className="space-y-8">
          {/* Schedule New Session - Only show when not in chat mode */}
          {!showSchedulingChat && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  Schedule New Session
                </h2>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <p className="text-gray-600 dark:text-slate-400 mb-4">
                  You can schedule sessions with mentors who have accepted your connection requests.
                  Please check your mentor connection status in your dashboard to see which mentors
                  have accepted your requests.
                </p>
                <Link
                  to="/learner/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none"
                >
                  Check Mentor Connections
                </Link>
              </div>
            </div>
          )}

          {/* Upcoming Sessions */}
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                Upcoming Sessions
              </h2>
              <span className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {sessions.upcoming.length}
              </span>
            </div>
            
            {sessions.upcoming.length > 0 ? (
              <div className="space-y-4">
                {sessions.upcoming.map(renderSessionCard)}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">No upcoming sessions</h3>
                <p className="text-gray-500 dark:text-slate-400">
                  You don't have any scheduled sessions yet.
                </p>
              </div>
            )}
          </div>

          {/* Completed Sessions */}
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Completed Sessions
              </h2>
              <span className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {sessions.completed.length}
              </span>
            </div>
            
            {sessions.completed.length > 0 ? (
              <div className="space-y-4">
                {sessions.completed.map(renderSessionCard)}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">No completed sessions</h3>
                <p className="text-gray-500 dark:text-slate-400">
                  Your completed sessions will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default Sessions;