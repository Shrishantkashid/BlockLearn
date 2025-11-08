import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Mail, Calendar } from 'lucide-react';
import api from '../api';
import SessionSchedulingChat from '../components/SessionSchedulingChat';

const ScheduleSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionScheduled, setSessionScheduled] = useState(false);
  const [scheduledSessionData, setScheduledSessionData] = useState(null);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/sessions/${sessionId}`);
      if (response.data.success) {
        setSession(response.data.data);
      } else {
        setError('Failed to load session details');
      }
    } catch (err) {
      setError('Error loading session details');
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionScheduled = async (sessionData) => {
    try {
      setSessionScheduled(true);
      setScheduledSessionData(sessionData);
      
      // Session has been created in the database and emails sent
      // The success message is shown in the UI
      console.log('Session scheduled:', sessionData);
    } catch (err) {
      console.error('Error scheduling session:', err);
      alert('There was an error scheduling the session. Please try again.');
    }
  };

  const handleBackToSessions = () => {
    navigate('/sessions');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="max-w-md p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Error</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{error}</p>
            <div className="mt-6">
              <button
                onClick={handleBackToSessions}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none"
              >
                Back to Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="max-w-md p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Session Not Found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">The session you're trying to access doesn't exist or you don't have permission to view it.</p>
            <div className="mt-6">
              <button
                onClick={handleBackToSessions}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none"
              >
                Back to Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToSessions}
            className="flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Schedule Session
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Discuss timing and availability with your mentor and schedule your session
          </p>
        </div>

        {sessionScheduled ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">Session Scheduled Successfully!</h3>
            <p className="mt-2 text-gray-600 dark:text-slate-400">
              Your session has been scheduled and emails have been sent to both you and your mentor.
            </p>
            <div className="mt-6 bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Session Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Skill:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{session.skill?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Mentor:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {session.mentor?.first_name} {session.mentor?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Date & Time:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(scheduledSessionData?.scheduled_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {scheduledSessionData?.duration_minutes} minutes
                  </span>
                </div>
                {scheduledSessionData?.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">Location:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {scheduledSessionData.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleBackToSessions}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View All Sessions
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {session.skill?.name}
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400">
                    with {session.mentor?.first_name} {session.mentor?.last_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Component */}
            <SessionSchedulingChat
              sessionId={session.id}
              mentor={session.mentor}
              student={session.student}
              skill={session.skill}
              onSessionScheduled={handleSessionScheduled}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleSession;