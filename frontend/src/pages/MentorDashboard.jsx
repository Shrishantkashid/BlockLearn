import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { getMentorConnections, acceptMentorConnection, rejectMentorConnection } from "../api";
import { BookOpen, Users, Calendar, Award, Settings, LogOut, User, Clock, MessageSquare, Trophy } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="w-32 h-32 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-slate-100">Unable to load dashboard</h2>
          <button
            onClick={handleLogout}
            className="px-4 py-2 transition-colors rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
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
      <header className="bg-white border-b border-gray-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-2xl font-bold text-primary">
                BlockLearn
              </Link>
              <span className="px-2 py-1 ml-4 text-xs rounded-full bg-primary/10 text-primary">
                Mentor
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 truncate dark:text-slate-300 max-w-32">{displayName}</span>
              <button 
                onClick={handleViewProfile}
                className="text-gray-600 transition-colors dark:text-slate-300 hover:text-primary"
              >
                <User className="w-5 h-5" />
              </button>
              <Link to="/settings" className="text-gray-600 transition-colors dark:text-slate-300 hover:text-primary">
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 transition-colors dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-slate-100">
            Welcome back, {user.first_name || user.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Thank you for being a mentor in our community.
          </p>
        </div>

        {/* Approval Status Message */}
        {user.mentorApproved !== true && (
          <div className="p-6 mb-8 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <h2 className="mb-2 text-xl font-semibold text-yellow-800 dark:text-yellow-200">
              Application Under Review
            </h2>
            <p className="mb-4 text-yellow-700 dark:text-yellow-300">
              Your mentor application is currently under review. Once approved, you'll gain full access to the mentor dashboard features.
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
              An interview has been scheduled for you. Please check your email for interview details.
            </p>
          </div>
        )}

        {/* Interview Status Card */}
        {user.mentorApproved === true && interview ? (
          <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-slate-100">
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
                  className="inline-block px-4 py-2 transition-colors rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Join Interview
                </button>
              </div>
            </div>
          </div>
        ) : user.mentorApproved === true ? (
          <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-slate-100">
              Interview Status
            </h2>
            <p className="text-gray-600 dark:text-slate-400">
              Your interview is being scheduled. Once scheduled, the interview link will be available here in your dashboard. 
              You will also receive an email with the interview details and link when it's ready.
            </p>
            <div className="p-4 mt-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Check this dashboard regularly for your interview link, or watch your email for a notification 
                with the meeting details. The interview link will appear in this section when your interview is scheduled.
              </p>
            </div>
          </div>
        ) : null}

        {/* Connection Requests */}
        {user.mentorApproved === true && (
          <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
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
              </div>
            </div>
            
            {connectionsLoading ? (
              <div className="py-4 text-center">
                <div className="inline-block w-6 h-6 mb-2 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
                <p className="text-gray-600 dark:text-slate-400">Loading connection requests...</p>
              </div>
            ) : connectionRequests.length === 0 ? (
              <div className="py-8 text-center rounded-lg bg-gray-50 dark:bg-slate-800">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p className="text-gray-600 dark:text-slate-400">
                  No connection requests at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {connectionRequests
                  .filter(request => request.status === 'pending')
                  .map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-slate-700">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-slate-100">
                          {request.learner.first_name} {request.learner.last_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {request.learner.email}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-3 py-1 text-sm text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-3 py-1 text-sm text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                }
                
                {connectionRequests.filter(request => request.status === 'pending').length === 0 && (
                  <div className="py-4 text-center">
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
          <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                My Sessions
              </h2>
              <button 
                onClick={fetchSessions}
                className="text-sm text-primary hover:text-primary/80"
              >
                Refresh
              </button>
            </div>
            
            {sessionsLoading ? (
              <div className="py-4 text-center">
                <div className="inline-block w-6 h-6 mb-2 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
                <p className="text-gray-600 dark:text-slate-400">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center rounded-lg bg-gray-50 dark:bg-slate-800">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                <p className="text-gray-600 dark:text-slate-400">
                  No sessions booked yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-slate-700">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-slate-100">
                        {session.skill.name} with {session.student.first_name} {session.student.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        {formatDate(session.scheduled_at)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                        Duration: {session.duration_minutes} minutes
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getSessionStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                      {session.meeting_link && session.status === 'scheduled' && (
                        <Link 
                          to={session.meeting_link}
                          className="px-3 py-1 text-sm text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
                        >
                          Join Session
                        </Link>
                      )}
                      {session.status === 'scheduled' && (
                        <Link 
                          to={`/mentor/session-booking/${session.id}`}
                          className="px-3 py-1 text-sm text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
                        >
                          Edit Session
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions (only show if mentor is approved) */}
        {user.mentorApproved === true && (
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            <button 
              onClick={handleViewProfile}
              className="p-6 text-left transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md"
            >
              <User className="w-8 h-8 mb-4 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">View Profile</h3>
              <p className="text-gray-600 dark:text-slate-400">See your profile details and information</p>
            </button>

            <Link to="/sessions" className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md">
              <Users className="w-8 h-8 mb-4 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">My Sessions</h3>
              <p className="text-gray-600 dark:text-slate-400">Manage your mentoring sessions</p>
            </Link>

            <Link to="/mentor/students" className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md">
              <Users className="w-8 h-8 mb-4 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-slate-100">My Students</h3>
              <p className="text-gray-600 dark:text-slate-400">View and manage your students</p>
            </Link>
          </div>
        )}

        {/* Leaderboard Link */}
        {user.mentorApproved === true && (
          <div className="mb-8">
            <Link 
              to="/mentor/leaderboard" 
              className="block p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md"
            >
              <div className="flex items-center">
                <Trophy className="w-8 h-8 mr-4 text-yellow-500" />
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                    Mentor Leaderboard
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    See how you rank among other mentors
                  </p>
                </div>
                <div className="ml-auto text-primary">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Stats Cards (only show if mentor is approved) */}
        {user.mentorApproved === true && (
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-primary/10">
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

            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
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

            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
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

            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
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