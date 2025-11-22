import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { getMentorConnections, acceptMentorConnection, rejectMentorConnection } from "../api";
import { BookOpen, Users, Calendar, Award, Settings, LogOut, User, Clock, MessageSquare } from "lucide-react";

function MentorDashboard() {
  const [user, setUser] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    navigate("/");
  };

  const handleViewProfile = () => {
    navigate("/profile/view");
  };

  useEffect(() => {
    // Check if we have user data and verify with backend
    const token = localStorage.getItem("token");
    
    if (!token) {
      // No token, redirect to login
      navigate("/login");
      return;
    }
    
    // Fetch current user data from backend to ensure we have the latest status
    fetchCurrentUser(token);
  }, [navigate]);

  useEffect(() => {
    if (user && user.mentorApproved === true) {
      fetchConnectionRequests();
      fetchSessions();
    }
  }, [user]);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.user) {
        const currentUser = response.data.user;
        
        // Update localStorage with latest user data
        localStorage.setItem("userData", JSON.stringify(currentUser));
        setUser(currentUser);
        
        // Check if user is a mentor
        if (currentUser.userType !== "mentor") {
          navigate("/dashboard");
          return;
        }
        
        // If mentor is approved, fetch interview details
        if (currentUser.mentorApproved === true) {
          fetchInterviewDetails(token);
        } else {
          // Mentor not approved, stay on dashboard but show appropriate message
          setLoading(false);
        }
      } else {
        // Invalid token or user not found, redirect to login
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      // If there's an error, try to use localStorage data as fallback
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      if (userData && (userData.id || userData._id)) {
        setUser(userData);
        
        // If mentor is approved according to localStorage, fetch interview details
        if (userData.mentorApproved === true) {
          fetchInterviewDetails(token);
        } else {
          setLoading(false);
        }
      } else {
        // No saved data, redirect to login
        handleLogout();
      }
    }
  };

  const fetchInterviewDetails = async (token) => {
    try {
      const response = await api.get("/api/auth/my-interview", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.data) {
        setInterview(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching interview details:", error);
      // Handle different error cases
      if (error.response && error.response.status === 404) {
        // No interview scheduled yet, which is fine
        console.log("No interview scheduled yet");
      } else if (error.response && error.response.status === 403) {
        // User is not a mentor
        console.error("User is not authorized as a mentor");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectionRequests = async () => {
    try {
      setConnectionsLoading(true);
      const response = await getMentorConnections();
      if (response.success) {
        setConnectionRequests(response.data);
      } else {
        // Handle API error response
        console.error("API Error:", response.message);
        // Show error to user
      }
    } catch (error) {
      console.error("Error fetching connection requests:", error);
      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        // Token might be expired, clear local storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        // Instead of navigating directly, let's show an error message
        // The ProtectedRoute will handle the redirect to prelogin
        console.error("Authentication error - token may be expired");
      } else if (error.response && error.response.status === 403) {
        // User is not authorized (might not be a mentor)
        console.error("User not authorized to view connections");
      } else {
        // Other errors
        console.error("Unexpected error:", error);
      }
      // Optionally show an error message to the user
    } finally {
      setConnectionsLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await api.get("/api/sessions");
      if (response.data.success) {
        // Filter sessions where user is the mentor
        const mentorSessions = response.data.data.filter(session => 
          session.mentor.id === user.id
        );
        setSessions(mentorSessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleAcceptRequest = async (connectionId) => {
    try {
      const response = await acceptMentorConnection(connectionId);
      if (response.success) {
        // Refresh the connection requests
        fetchConnectionRequests();
      }
    } catch (error) {
      console.error("Error accepting connection request:", error);
    }
  };

  const handleRejectRequest = async (connectionId) => {
    try {
      const response = await rejectMentorConnection(connectionId);
      if (response.success) {
        // Refresh the connection requests
        fetchConnectionRequests();
      }
    } catch (error) {
      console.error("Error rejecting connection request:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSessionStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">Unable to load dashboard</h2>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const nameAvailable = (user?.firstName || user?.first_name) && (user?.lastName || user?.last_name);
  const emailLocal = (user?.email || "").split("@")[0];
  const displayName = nameAvailable
    ? `${user.firstName || user.first_name} ${user.lastName || user.last_name}`
    : (emailLocal || "Mentor");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-2xl font-bold text-primary">
                BlockLearn
              </Link>
              <span className="ml-4 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                Mentor
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-slate-300 text-sm truncate max-w-32">{displayName}</span>
              <button 
                onClick={handleViewProfile}
                className="text-gray-600 dark:text-slate-300 hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
              <Link to="/settings" className="text-gray-600 dark:text-slate-300 hover:text-primary transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Welcome back, {user.first_name || user.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Thank you for being a mentor in our community.
          </p>
        </div>

        {/* Approval Status Message */}
        {user.mentorApproved !== true && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Application Under Review
            </h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Your mentor application is currently under review. Once approved, you'll gain full access to the mentor dashboard features.
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
              An interview has been scheduled for you. Please check your email for interview details.
            </p>
          </div>
        )}

        {/* Interview Status Card */}
        {user.mentorApproved === true && interview ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Upcoming Interview
                </h2>
                <div className="flex items-center gap-4 text-gray-600 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(interview.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(interview.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button 
                  onClick={() => {
                    // Redirect to the specific moderated Jitsi link you provided
                    window.location.href = "https://meet.jit.si/moderated/4754bc865a90cabf3bfc32a4de2b5dca678ab4cb992dba03b38a750e9354a408";
                  }}
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Join Interview
                </button>
              </div>
            </div>
          </div>
        ) : user.mentorApproved === true ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              Interview Status
            </h2>
            <p className="text-gray-600 dark:text-slate-400">
              Your interview is being scheduled. Once scheduled, the interview link will be available here in your dashboard. 
              You will also receive an email with the interview details and link when it's ready.
            </p>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Check this dashboard regularly for your interview link, or watch your email for a notification 
                with the meeting details. The interview link will appear in this section when your interview is scheduled.
              </p>
            </div>
          </div>
        ) : null}

        {/* Connection Requests */}
        {user.mentorApproved === true && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Connection Requests
              </h2>
              <div className="flex space-x-2">
                <button 
                  onClick={fetchConnectionRequests}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Refresh
                </button>
                <Link 
                  to="/mentor/session-booking"
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Book New Session
                </Link>
              </div>
            </div>
            
            {connectionsLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
                <p className="text-gray-600 dark:text-slate-400">Loading connection requests...</p>
              </div>
            ) : connectionRequests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400">
                  No connection requests at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {connectionRequests
                  .filter(request => request.status === 'pending')
                  .map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-slate-100">
                          {request.learner.first_name} {request.learner.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {request.learner.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                }
                
                {connectionRequests.filter(request => request.status === 'pending').length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-slate-400">
                      No pending connection requests.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Sessions */}
        {user.mentorApproved === true && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Upcoming Sessions
              </h2>
              <button 
                onClick={fetchSessions}
                className="text-sm text-primary hover:text-primary/80"
              >
                Refresh
              </button>
            </div>
            
            {sessionsLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
                <p className="text-gray-600 dark:text-slate-400">Loading sessions...</p>
              </div>
            ) : sessions.filter(session => session.status === 'scheduled').length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <Calendar className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-slate-400">
                  No upcoming sessions scheduled.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions
                  .filter(session => session.status === 'scheduled')
                  .map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-slate-100">
                          {session.skill.name} with {session.student.first_name} {session.student.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {formatDate(session.scheduled_at)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                          Duration: {session.duration_minutes} minutes
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSessionStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        {session.meeting_link && (
                          <Link 
                            to={session.meeting_link}
                            className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Join Session
                          </Link>
                        )}
                        <Link 
                          to={`/mentor/session-booking/${session.id}`}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Edit Session
                        </Link>

                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        {/* Quick Actions (only show if mentor is approved) */}
        {user.mentorApproved === true && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button 
              onClick={handleViewProfile}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow text-left"
            >
              <User className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">View Profile</h3>
              <p className="text-gray-600 dark:text-slate-400">See your profile details and information</p>
            </button>

            <Link to="/sessions" className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <Users className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">My Sessions</h3>
              <p className="text-gray-600 dark:text-slate-400">Manage your mentoring sessions</p>
            </Link>

            <Link to="/match" className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <Users className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">My Students</h3>
              <p className="text-gray-600 dark:text-slate-400">View and manage your students</p>
            </Link>
          </div>
        )}

        {/* Stats Cards (only show if mentor is approved) */}
        {user.mentorApproved === true && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Students Mentored</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                    {sessions.filter(s => s.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Hours Contributed</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                    {Math.floor(sessions.reduce((total, session) => 
                      session.status === 'completed' ? total + session.duration_minutes : total, 0) / 60)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Upcoming Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                    {sessions.filter(s => s.status === 'scheduled').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Connection Requests</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                    {connectionRequests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MentorDashboard;