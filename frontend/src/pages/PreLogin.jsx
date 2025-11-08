import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles,
  User,
  BookOpen,
  Users,
  Award,
  ArrowRight
} from 'lucide-react';
import api from '../api';

const PreLogin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Verify token is still valid by making a request to the backend
        verifyToken(token, parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token, userData) => {
    try {
      const response = await api.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success && response.data.user) {
        // Token is valid, update user data
        setUser(response.data.user);
        // Also update localStorage with latest user data
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      } else {
        // Token is invalid, clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
    } catch (error) {
      // Token is invalid or expired, clear localStorage
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsUser = () => {
    if (user) {
      // Redirect based on user type
      if (user.userType === 'mentor') {
        // Check if mentor is approved
        if (user.mentorApproved === true) {
          navigate("/mentor/dashboard");
        } else {
          // If not approved, still go to mentor dashboard where they can see their status
          navigate("/mentor/dashboard");
        }
      } else {
        // Check if profile is complete
        if (!user.profileComplete) {
          navigate("/profile");
        } else {
          navigate("/dashboard");
        }
      }
    }
  };

  const handleLoginAsDifferentUser = () => {
    // Clear existing login data
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    // Navigate to regular login page
    navigate('/login');
  };

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-blue-100/20 to-indigo-100/20 dark:from-green-900/20 dark:via-blue-900/20 dark:to-indigo-900/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <Sparkles className="w-10 h-10 text-primary" />
              <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BlockLearn
              </span>
            </Link>
            
            {user ? (
              <>
                <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back, {user.firstName || user.first_name}!</h2>
                <p className="text-muted-foreground">
                  You're already logged in to your BlockLearn account
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to BlockLearn</h2>
                <p className="text-muted-foreground">
                  Join our peer-to-peer learning community
                </p>
              </>
            )}
          </div>

          {/* Pre-Login Card */}
          <div className="backdrop-blur-md bg-white/50 dark:bg-slate-900/50 border border-border/50 rounded-2xl p-8 shadow-2xl">
            {user ? (
              // User is already logged in
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto bg-gray-200 dark:bg-slate-700 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-gray-500 dark:text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">
                    {user.firstName || user.first_name} {user.lastName || user.last_name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {user.email}
                  </p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {user.userType === 'mentor' ? 'Mentor' : 'Learner'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                  <div className="text-center p-3 rounded-lg bg-card/30">
                    <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Continue Learning</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-card/30">
                    <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Find Mentors</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-card/30">
                    <Award className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Earn Certificates</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleContinueAsUser}
                    className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground border border-primary/20 shadow-lg hover:bg-primary/90 transition-all font-medium flex items-center justify-center"
                  >
                    Continue to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleLoginAsDifferentUser}
                    className="w-full px-8 py-4 rounded-xl bg-card dark:bg-slate-800 text-foreground border border-border shadow-sm hover:bg-card/80 dark:hover:bg-slate-800/80 transition-all font-medium"
                  >
                    Login as Different User
                  </button>
                </div>
              </div>
            ) : (
              // User is not logged in
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="mx-auto bg-gray-200 dark:bg-slate-700 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-gray-500 dark:text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Ready to Start Learning?
                  </h3>
                  <p className="text-muted-foreground">
                    Login to access your personalized dashboard
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleLogin}
                    className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground border border-primary/20 shadow-lg hover:bg-primary/90 transition-all font-medium"
                  >
                    Login to Your Account
                  </button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card/50 dark:bg-slate-900/50 text-muted-foreground">
                        New to BlockLearn?
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleGetStarted}
                    className="w-full px-8 py-4 rounded-xl bg-card dark:bg-slate-800 text-foreground border border-border shadow-sm hover:bg-card/80 dark:hover:bg-slate-800/80 transition-all font-medium"
                  >
                    Create New Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreLogin;