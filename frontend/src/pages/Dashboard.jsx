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
  ArrowLeft
} from 'lucide-react';
import api from '../api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    skills: 0,
    sessionsCompleted: 0,
    certificates: 0,
    walletConnected: false
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [skillsProgress, setSkillsProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleViewProfile = () => {
    navigate('/profile/view');
  };

  useEffect(() => {
    console.log("Dashboard useEffect triggered");
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Get current user data
      const userResponse = await api.get('/api/auth/me');
      
      if (userResponse.data.success && userResponse.data.user) {
        const currentUser = userResponse.data.user;
        setUser(currentUser);
        
        // Check if profile is complete
        if (!currentUser.profileComplete) {
          navigate("/profile");
          return;
        }
        
        // Fetch user sessions
        const sessionsResponse = await api.get('/api/sessions');
        if (sessionsResponse.data.success) {
          const sessions = sessionsResponse.data.data;
          
          // Calculate stats
          const completedSessions = sessions.filter(session => session.status === 'completed').length;
          const upcomingSessions = sessions.filter(session => session.status === 'scheduled').length;
          
          setStats({
            skills: 3, // This would need to come from a skills API
            sessionsCompleted: completedSessions,
            certificates: 2, // This would need to come from a certificates API
            walletConnected: true // This would need to come from a wallet API
          });
          
          // Set recent sessions (last 2)
          const sortedSessions = [...sessions].sort((a, b) => 
            new Date(b.scheduled_at) - new Date(a.scheduled_at)
          );
          setRecentSessions(sortedSessions.slice(0, 2));
          
          // Set skills progress (hardcoded for now, but would come from API)
          setSkillsProgress([
            { name: 'JavaScript', progress: 75, level: 'Intermediate' },
            { name: 'React', progress: 60, level: 'Intermediate' },
            { name: 'Node.js', progress: 40, level: 'Beginner' }
          ]);
        }
      } else {
        // No user data, redirect to login
        navigate("/login");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      // Try to use localStorage as fallback
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      if (userData && (userData.id || userData._id)) {
        setUser(userData);
      } else {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="btn-primary px-6 py-3"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const nameAvailable = (user?.firstName || user?.first_name) && (user?.lastName || user?.last_name);
  const emailLocal = (user?.email || "").split("@")[0];
  const displayName = nameAvailable
    ? `${user.firstName || user.first_name} ${user.lastName || user.last_name}`
    : (emailLocal || "User");

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
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-slate-300 text-sm truncate max-w-32">{displayName}</span>
              <button 
                onClick={() => navigate('/learner/mentors')}
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
            Welcome back, {user.firstName || user.first_name}!
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => navigate('/learner/mentors')}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow text-left"
          >
            <User className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">View Mentors</h3>
            <p className="text-gray-600 dark:text-slate-400">See your connected mentors</p>
          </button>

          <Link to="/match" className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <Users className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Find a Mentor</h3>
            <p className="text-gray-600 dark:text-slate-400">Connect with experienced mentors in your field</p>
          </Link>

          <Link to="/sessions" className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
            <BookOpen className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Book a Session</h3>
            <p className="text-gray-600 dark:text-slate-400">Schedule personalized learning sessions</p>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Skills Learning</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{stats.skills}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Sessions Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{stats.sessionsCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Certificates</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{stats.certificates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Wallet Connected</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {stats.walletConnected ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sessions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Recent Sessions</h2>
            <div className="space-y-4">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-slate-100">{session.skill?.name || 'Session'}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">with {session.mentor?.firstName} {session.mentor?.lastName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                    }`}>
                      {session.status === 'completed' ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-slate-400">No recent sessions</p>
              )}
            </div>
            <Link to="/sessions" className="mt-4 inline-block text-primary hover:text-primary/80 font-medium">
              View all sessions →
            </Link>
          </div>

          {/* Skills Progress */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Skills Progress</h2>
            <div className="space-y-4">
              {skillsProgress.length > 0 ? (
                skillsProgress.map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{skill.name}</span>
                      <span className="text-sm text-gray-600 dark:text-slate-400">{skill.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${skill.progress}%` }}></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-slate-400">No skills progress data available</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;