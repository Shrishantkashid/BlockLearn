import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Mail, Calendar, User, Users } from 'lucide-react';
import api from '../api';
import MutualSessionBooking from '../components/MutualSessionBooking';

const MutualSessionBookingPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionScheduled, setSessionScheduled] = useState(false);
  const [scheduledSessionData, setScheduledSessionData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [connectedMentors, setConnectedMentors] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);

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
    
    if (sessionId) {
      fetchSessionDetails();
    } else {
      // If no session ID, load connected mentors and skills for new session creation
      fetchConnectedMentorsAndSkills();
      setLoading(false);
    }
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

  const fetchConnectedMentorsAndSkills = async () => {
    try {
      // Fetch connected mentors (learner connections)
      const connectionsResponse = await api.get('/api/mentor/learner-connections');
      if (connectionsResponse.data.success) {
        // Filter for accepted connections only
        const acceptedConnections = connectionsResponse.data.data.filter(conn => conn.status === 'accepted');
        // Extract unique mentors from connections
        const mentors = acceptedConnections.map(conn => conn.mentor);
        setConnectedMentors(mentors);
      }
      
      // Fetch skills
      const skillsResponse = await api.get('/api/skills');
      if (skillsResponse.data.success) {
        setSkills(skillsResponse.data.data);
      }
    } catch (err) {
      console.error('Error fetching connected mentors and skills:', err);
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

  // If we're creating a new session request
  if (!session && !sessionId) {
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
              Book New Session
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">
              Select a connected mentor and skill to schedule a session.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mentor Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Select a Connected Mentor
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {connectedMentors.length > 0 ? (
                    connectedMentors.map((mentor) => (
                      <div
                        key={mentor.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedMentor?.id === mentor.id
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                        onClick={() => setSelectedMentor(mentor)}
                      >
                        <div className="flex items-center">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {mentor.first_name} {mentor.last_name}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              {mentor.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No connected mentors</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        You need to connect with a mentor before booking a session.
                      </p>
                      <div className="mt-4">
                        <Link
                          to="/match"
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
                        >
                          Find Mentors
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skill Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Select a Skill
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {skills.length > 0 ? (
                    skills.map((skill) => (
                      <div
                        key={skill.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedSkill?.id === skill.id
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                        onClick={() => setSelectedSkill(skill)}
                      >
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {skill.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {skill.category}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-slate-700">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No skills available</h3>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => {
                  if (selectedMentor && selectedSkill) {
                    // Create a temporary session object for the booking component
                    const tempSession = {
                      id: 'new',
                      mentor: selectedMentor,
                      student: currentUser,
                      skill: selectedSkill
                    };
                    setSession(tempSession);
                  }
                }}
                disabled={!selectedMentor || !selectedSkill}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none disabled:opacity-50"
              >
                Continue to Booking
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
            Mutual Session Booking
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Collaborate with your mentor to schedule your session
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

            {/* Mutual Booking Component */}
            {currentUser && session && (
              <MutualSessionBooking
                sessionId={session.id}
                mentor={session.mentor}
                student={session.student}
                skill={session.skill}
                currentUser={currentUser}
                onSessionScheduled={handleSessionScheduled}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MutualSessionBookingPage;