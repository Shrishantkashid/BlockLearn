import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  BookOpen, 
  Users, 
  Award, 
  Wallet,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Search,
  Bell,
  MessageCircle,
  ClockIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';
import api from '../api';

const LearnerDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    skills: 5,
    sessionsCompleted: 12,
    certificates: 3,
    walletConnected: true
  });
  const [upcomingSessions, setUpcomingSessions] = useState([
    {
      id: 1,
      skill: 'JavaScript Fundamentals',
      mentor: 'Jane Smith',
      date: '2023-06-15',
      time: '14:00',
      status: 'confirmed'
    },
    {
      id: 2,
      skill: 'React Hooks',
      mentor: 'Mike Johnson',
      date: '2023-06-18',
      time: '10:00',
      status: 'pending'
    }
  ]);
  const [progressData, setProgressData] = useState([
    { skill: 'JavaScript', progress: 75, level: 'Intermediate' },
    { skill: 'React', progress: 60, level: 'Intermediate' },
    { skill: 'Node.js', progress: 40, level: 'Beginner' },
    { skill: 'Python', progress: 25, level: 'Beginner' }
  ]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleViewProfile = () => {
    navigate('/learner/profile');
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("LearnerDashboard: Checking authentication");
        
        // Check if we have user data in localStorage
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("userData");
        
        console.log("LearnerDashboard: token =", token);
        console.log("LearnerDashboard: userData =", userData);
        
        if (!token || !userData) {
          console.log("LearnerDashboard: No token or userData found");
          setError("Authentication required");
          navigate("/login");
          return;
        }
        
        let parsedUser;
        try {
          parsedUser = JSON.parse(userData);
          console.log("LearnerDashboard: parsedUser =", parsedUser);
        } catch (parseError) {
          console.error("LearnerDashboard: Error parsing user data:", parseError);
          setError("Invalid user data");
          navigate("/login");
          return;
        }
        
        // Validate user data
        if (!parsedUser || !(parsedUser.id || parsedUser._id)) {
          console.log("LearnerDashboard: Invalid user data structure");
          setError("Invalid user data");
          navigate("/login");
          return;
        }
        
        // Check user type
        if (parsedUser.userType && parsedUser.userType !== 'learner' && parsedUser.userType !== 'admin') {
          console.log("LearnerDashboard: User is not a learner or admin");
          if (parsedUser.userType === 'mentor') {
            navigate("/mentor/dashboard");
          } else if (parsedUser.userType === 'admin') {
            navigate("/admin/dashboard");
          } else {
            navigate("/login");
          }
          return;
        }
        
        setUser(parsedUser);
        setError(null);
      } catch (error) {
        console.error("LearnerDashboard: Error in authentication check:", error);
        setError("Authentication error");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Fetch connection requests when user is loaded
  useEffect(() => {
    if (user) {
      fetchConnectionRequests();
    }
  }, [user]);

  const fetchConnectionRequests = async () => {
    try {
      setConnectionsLoading(true);
      const response = await api.get('/api/mentor/learner-connections');
      if (response.data.success) {
        setConnectionRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching connection requests:", error);
    } finally {
      setConnectionsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If user is null after loading, show error or redirect
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Authentication error. Please log in again.</div>
          <button 
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const nameAvailable = (user?.firstName || user?.first_name) && (user?.lastName || user?.last_name);
  const emailLocal = (user?.email || "").split("@")[0];
  const displayName = nameAvailable
    ? `${user.firstName || user.first_name} ${user.lastName || user.last_name}`
    : (emailLocal || "User");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/learner/dashboard" className="text-2xl font-bold text-primary">
                BlockLearn
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-600 dark:text-slate-300 hover:text-primary transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700 dark:text-slate-300 text-sm font-medium hidden md:block">
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleViewProfile}
                  className="p-2 text-gray-600 dark:text-slate-300 hover:text-primary transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>
                <Link to="/learner/settings" className="p-2 text-gray-600 dark:text-slate-300 hover:text-primary transition-colors">
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Completion Notification */}
      {user.profileComplete === false && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
                  <span className="font-medium">Profile incomplete!</span> Please complete your profile to unlock all features.
                  <button 
                    onClick={handleViewProfile}
                    className="ml-2 font-medium underline text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100"
                  >
                    Complete Profile
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {displayName}!
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Skills Learning</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.skills}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Sessions Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sessionsCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Certificates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.certificates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Wallet Connected</p>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {stats.walletConnected ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Requests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mentor Connection Status</h2>
            <button 
              onClick={fetchConnectionRequests}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Refresh
            </button>
          </div>
          
          {connectionsLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600 dark:text-slate-400">Loading connection requests...</span>
              </div>
            </div>
          ) : connectionRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">No connection requests</h3>
              <p className="text-gray-500 dark:text-slate-400">
                You haven't sent any mentor connection requests yet.
              </p>
              <div className="mt-6">
                <Link
                  to="/match"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Find a Mentor
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                {connectionRequests.map((request) => (
                  <li key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`p-2 rounded-lg ${
                            request.status === 'accepted' 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : request.status === 'pending' 
                                ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                                : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {request.status === 'accepted' ? (
                              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : request.status === 'pending' ? (
                              <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            ) : (
                              <XIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {request.mentor.first_name} {request.mentor.last_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {request.mentor.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                            Requested on {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'accepted' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : request.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        
                        {request.status === 'accepted' && (
                          <button 
                            onClick={() => {
                              // Navigate to sessions page
                              navigate('/sessions');
                            }}
                            className="ml-3 px-3 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Schedule Session
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Quick Actions and Upcoming Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <button 
                onClick={handleViewProfile}
                className="w-full bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow text-left flex items-center"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">View Profile</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">See your profile details</p>
                </div>
              </button>

              <Link to="/match" className="block bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Find a Mentor</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Connect with experienced mentors</p>
                  </div>
                </div>
              </Link>

              <Link to="/sessions" className="block bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Book a Session</h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Schedule learning sessions</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Sessions</h2>
              <Link to="/sessions" className="text-sm text-primary hover:text-primary/80 font-medium">
                View all
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              {upcomingSessions.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                  {upcomingSessions.map((session) => (
                    <li key={session.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <Calendar className="w-5 h-5 text-primary" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h3 className="font-medium text-gray-900 dark:text-white">{session.skill}</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">with {session.mentor}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
                              {session.date} at {session.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            session.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No upcoming sessions</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    You don't have any scheduled sessions yet.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/sessions"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book a Session
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills Progress */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skills Progress</h2>
            <Link to="/skills" className="text-sm text-primary hover:text-primary/80 font-medium">
              View all skills
            </Link>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="space-y-6">
              {progressData.map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{skill.skill}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">{skill.level}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{skill.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${skill.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LearnerDashboard;