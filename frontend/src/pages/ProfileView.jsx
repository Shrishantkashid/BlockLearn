import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  BookOpen, 
  Target, 
  Heart, 
  ArrowLeft,
  Edit3
} from 'lucide-react';
import api from '../api';

const ProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const userId = userData?.id || userData?._id;
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        navigate("/login");
        setLoading(false);
        return;
      }

      const response = await api.get(`/api/auth/profile/${userId}`);
      if (response.data.success) {
        setProfile(response.data);
      } else {
        setError(response.data.message || "Failed to load profile");
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      setError("Failed to load profile. Please try again.");
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
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Error</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => {
              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              if (userData.userType === "mentor") {
                navigate("/mentor/dashboard");
              } else {
                navigate("/dashboard");
              }
            }}
            className="btn-primary px-6 py-3"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg max-w-md w-full text-center">
          <div className="text-yellow-500 dark:text-yellow-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Profile Not Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">No profile data available for this user.</p>
          <button
            onClick={() => {
              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              if (userData.userType === "mentor") {
                navigate("/mentor/dashboard");
              } else {
                navigate("/dashboard");
              }
            }}
            className="btn-primary px-6 py-3"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const userProfile = profile.profile;
  const user = profile.user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                if (userData.userType === "mentor") {
                  navigate("/mentor/dashboard");
                } else {
                  navigate("/dashboard");
                }
              }}
              className="inline-flex items-center space-x-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="hidden sm:block text-gray-300 dark:text-slate-600">|</div>
            <div className="text-sm text-gray-500 dark:text-slate-400">
              <span className="text-gray-900 dark:text-slate-100 font-medium">Profile Details</span>
            </div>
          </div>
          <button
            onClick={() => {
              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              if (userData.userType === "mentor") {
                navigate("/mentor/profile");
              } else {
                navigate("/profile");
              }
            }}
            className="btn-primary px-4 py-2 flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-8 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
              <div className="bg-white dark:bg-slate-700 rounded-full p-2 w-20 h-20 flex items-center justify-center mb-4 sm:mb-0">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white">
                  {userProfile.fullName || `${user.firstName} ${user.lastName}`}
                </h1>
                <p className="text-primary-100 mt-1">{user.email}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                  <span>Profile Complete</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary" />
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Full Name</p>
                    <p className="text-gray-900 dark:text-slate-100">{userProfile.full_name || userProfile.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">School/College</p>
                    <p className="text-gray-900 dark:text-slate-100">{userProfile.school_name || userProfile.schoolName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Grade/Year</p>
                    <p className="text-gray-900 dark:text-slate-100">{userProfile.grade}</p>
                  </div>
                </div>
              </div>

              {/* About */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary" />
                  About
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Bio</p>
                    <p className="text-gray-900 dark:text-slate-100">
                      {userProfile.bio || "No bio provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills & Learning */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Skills & Learning
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Skills to Learn</p>
                    <p className="text-gray-900 dark:text-slate-100">
                      {userProfile.skills_to_learn || "No skills specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Skills to Teach</p>
                    <p className="text-gray-900 dark:text-slate-100">
                      {userProfile.skills_to_teach || "No skills specified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Goals & Interests */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-primary" />
                  Goals & Interests
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Learning Goals</p>
                    <p className="text-gray-900 dark:text-slate-100">
                      {userProfile.learning_goals || "No goals specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Interests</p>
                    <p className="text-gray-900 dark:text-slate-100">
                      {userProfile.interests || "No interests specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                  if (userData.userType === "mentor") {
                    navigate("/mentor/profile");
                  } else {
                    navigate("/profile");
                  }
                }}
                className="btn-primary px-6 py-3 flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileView;