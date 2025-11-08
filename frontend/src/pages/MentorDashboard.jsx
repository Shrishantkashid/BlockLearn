import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api"; // Use the api service instead of axios directly
import { BookOpen, Users, Calendar, Award, Settings, LogOut, User, Clock } from "lucide-react";

function MentorDashboard() {
  const [user, setUser] = useState(null);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
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
      const response = await api.get("/api/admin/mentor-interviews", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const mentorInterviews = response.data.data;
      const currentUserInterview = mentorInterviews.find(
        mentor => mentor.id === userData.id && mentor.interview
      );
      
      if (currentUserInterview) {
        setInterview(currentUserInterview.interview);
      }
    } catch (error) {
      console.error("Error fetching interview details:", error);
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
            <div className="mt-4">
              <Link 
                to="/interview/code-entry" 
                className="inline-block px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Enter Interview Code
              </Link>
            </div>
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
                      {new Date(interview.scheduled_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(interview.scheduled_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">Scheduled</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  Interview Code: {interview.interview_code}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                to={interview.meeting_link}
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Join Interview
              </Link>
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
            <div className="mt-4">
              <Link 
                to="/interview/code-entry" 
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Enter Interview Code
              </Link>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                If you have received your interview code, click above to enter it and join your session.
              </p>
            </div>
          </div>
        ) : null}

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
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">0</p>
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
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Sessions Completed</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">0</p>
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
                  <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">0</p>
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