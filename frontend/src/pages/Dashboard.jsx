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

const Dashboard = () => {
  const [user, setUser] = useState(null);
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
    // Check if we have user data and try to get real user data
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const token = localStorage.getItem("token");
    
    if (userData && (userData.id || userData._id)) {
      // Check if profile is complete
      if (!userData.profileComplete) {
        navigate("/profile");
        return;
      }
      
      setUser(userData);
    } else {
      // No saved data, redirect to login
      navigate("/login");
    }
  }, [navigate]);

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
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={handleViewProfile}
            className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow text-left"
          >
            <User className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">View Profile</h3>
            <p className="text-gray-600 dark:text-slate-400">See your profile details and information</p>
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
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">3</p>
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
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">5</p>
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
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">2</p>
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
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">Yes</p>
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
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100">JavaScript Fundamentals</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">with Jane Smith</p>
                </div>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs rounded-full">
                  Completed
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100">React Hooks</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400">with Mike Johnson</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                  Upcoming
                </span>
              </div>
            </div>
            <Link to="/sessions" className="mt-4 inline-block text-primary hover:text-primary/80 font-medium">
              View all sessions →
            </Link>
          </div>

          {/* Skills Progress */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Skills Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">JavaScript</span>
                  <span className="text-sm text-gray-600 dark:text-slate-400">75%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">React</span>
                  <span className="text-sm text-gray-600 dark:text-slate-400">60%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">Node.js</span>
                  <span className="text-sm text-gray-600 dark:text-slate-400">40%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;