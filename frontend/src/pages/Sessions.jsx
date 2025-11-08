import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  Award, 
  MessageSquare,
  ArrowLeft,
  CheckCircle,
  Video,
  Copy,
  Check
} from 'lucide-react';
import api from '../api';
import LiveSessionModal from '../components/LiveSessionModal';
import LiveSessionCode from '../components/LiveSessionCode';

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

  useEffect(() => {
    fetchUserSessions();
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
      // Fallback to mock data if API fails
      setTimeout(() => {
        setSessions({
          upcoming: [
            {
              id: 1,
              title: 'JavaScript Fundamentals',
              mentor: { first_name: 'Alex', last_name: 'Johnson' },
              time: 'Tomorrow, 2:00 PM',
              duration: '1 hour',
              location: 'Online',
              status: 'scheduled',
              skill: { name: 'JavaScript' }
            },
            {
              id: 2,
              title: 'UI/UX Design Basics',
              mentor: { first_name: 'Sarah', last_name: 'Chen' },
              time: 'Friday, 4:00 PM',
              duration: '1.5 hours',
              location: 'Library Room 201',
              status: 'scheduled',
              skill: { name: 'UI/UX Design' }
            }
          ],
          completed: [
            {
              id: 3,
              title: 'React Advanced Concepts',
              mentor: { first_name: 'Mike', last_name: 'Rodriguez' },
              time: 'Yesterday, 3:00 PM',
              duration: '2 hours',
              location: 'Online',
              status: 'completed',
              hasFeedback: false,
              skill: { name: 'React' }
            },
            {
              id: 4,
              title: 'Node.js Backend Development',
              mentor: { first_name: 'Emma', last_name: 'Wilson' },
              time: 'Last week, 1:00 PM',
              duration: '1.5 hours',
              location: 'Online',
              status: 'completed',
              hasFeedback: true,
              skill: { name: 'Node.js' }
            }
          ]
        });
      }, 1000);
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
            <div className="flex space-x-2">
              <button
                onClick={() => openLiveSessionModal(session)}
                className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Video className="w-4 h-4 mr-1" />
                Start Live Session
              </button>
              <button className="btn-primary">Join Session</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold gradient-text">BlockLearn</h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/skills" className="text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Skills
              </Link>
              <Link to="/match" className="text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Match
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Link to="/dashboard" className="flex items-center text-gray-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">My Sessions</h1>
          <p className="text-gray-600 dark:text-slate-400">Manage your upcoming and completed learning sessions</p>
        </div>

        {/* Generated Live Session Code */}
        {generatedLiveSession && (
          <div className="mb-8">
            <LiveSessionCode 
              liveSessionData={generatedLiveSession}
              onJoinSession={handleJoinLiveSession}
            />
          </div>
        )}

        {/* Upcoming Sessions */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-primary" />
              Upcoming Sessions
            </h2>
            <span className="ml-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {sessions.upcoming.length}
            </span>
          </div>
          
          {sessions.upcoming.length > 0 ? (
            <div className="space-y-4">
              {sessions.upcoming.map(renderSessionCard)}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center border border-gray-200 dark:border-slate-700">
              <Calendar className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No Upcoming Sessions</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">You don't have any scheduled sessions yet.</p>
              <Link to="/match" className="btn-primary">
                Find a Mentor
              </Link>
            </div>
          )}
        </section>

        {/* Completed Sessions */}
        <section>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-primary" />
              Completed Sessions
            </h2>
            <span className="ml-3 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
              {sessions.completed.length}
            </span>
          </div>
          
          {sessions.completed.length > 0 ? (
            <div className="space-y-4">
              {sessions.completed.map(renderSessionCard)}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center border border-gray-200 dark:border-slate-700">
              <CheckCircle className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No Completed Sessions</h3>
              <p className="text-gray-500 dark:text-slate-400 mb-4">You haven't completed any sessions yet.</p>
              <Link to="/match" className="btn-primary">
                Find a Mentor
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Live Session Modal */}
      {liveSessionModal.isOpen && (
        <LiveSessionModal
          session={liveSessionModal.session}
          onClose={closeLiveSessionModal}
          onCodeGenerated={handleLiveSessionCodeGenerated}
        />
      )}

      {/* Feedback Modal */}
      {feedbackModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Session Feedback</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">How was your session? Your feedback helps us improve.</p>
            
            <div className="feedback mb-6">
              <label className="angry">
                <input type="radio" name="feedback" />
                <div>
                  <svg className="eye" viewBox="0 0 7 4">
                    <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1" />
                  </svg>
                  <svg className="eye right" viewBox="0 0 7 4">
                    <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1" />
                  </svg>
                  <svg className="mouth" viewBox="0 0 18 7">
                    <path d="M1,5.5 C1.83333333,7.16666667 3.16666667,8 5,8 C6.83333333,8 8.16666667,7.16666667 9,5.5 C9.83333333,7.16666667 11.1666667,8 13,8 C14.8333333,8 16.1666667,7.16666667 17,5.5" />
                  </svg>
                </div>
              </label>
              <label className="sad">
                <input type="radio" name="feedback" />
                <div>
                  <svg className="eye" viewBox="0 0 7 4">
                    <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1" />
                  </svg>
                  <svg className="eye right" viewBox="0 0 7 4">
                    <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1" />
                  </svg>
                  <svg className="mouth" viewBox="0 0 18 7">
                    <path d="M1,1 C1.83333333,2.16666667 3.16666667,2.75 5,2.75 C6.83333333,2.75 8.16666667,2.16666667 9,1 C9.83333333,2.16666667 11.1666667,2.75 13,2.75 C14.8333333,2.75 16.1666667,2.16666667 17,1" />
                  </svg>
                </div>
              </label>
              <label className="ok">
                <input type="radio" name="feedback" />
                <div></div>
              </label>
              <label className="good">
                <input type="radio" name="feedback" />
                <div>
                  <svg className="eye" viewBox="0 0 7 4">
                    <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1" />
                  </svg>
                  <svg className="eye right" viewBox="0 0 7 4">
                    <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1" />
                  </svg>
                  <svg className="mouth" viewBox="0 0 18 7">
                    <path d="M1,5.5 C1.83333333,4.33333333 3.16666667,3.75 5,3.75 C6.83333333,3.75 8.16666667,4.33333333 9,5.5" />
                  </svg>
                </div>
              </label>
              <label className="happy">
                <input type="radio" name="feedback" />
                <div>
                  <svg className="eye" viewBox="0 0 7 4">
                    <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1" />
                  </svg>
                  <svg className="eye right" viewBox="0 0 7 4">
                    <path d="M1,1 C1.83333333,2.16666667 2.66666667,2.75 3.5,2.75 C4.33333333,2.75 5.16666667,2.16666667 6,1" />
                  </svg>
                </div>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeFeedbackModal}
                className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={closeFeedbackModal}
                className="btn-primary"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;