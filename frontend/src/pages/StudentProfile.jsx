import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api, { refreshUserData } from '../api';

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    fullName: "",
    schoolName: "",
    grade: "",
    bio: "",
    skillsToLearn: "",
    skillsToTeach: "",
    learningGoals: "",
    interests: ""
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const navigate = useNavigate();
  const location = useLocation();
  
  try {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = userData?.id || userData?._id;
    
    // Redirect to login if user is not authenticated
    useEffect(() => {
      if (!token || !userData || !userId) {
        navigate("/login");
      }
    }, [token, userData, userId, navigate]);

    useEffect(() => {
      const stored = localStorage.getItem("studentProfile");
      if (stored) {
        try { setProfile(JSON.parse(stored)); } catch {}
      }
    }, [location.key]); // Add location.key as dependency

    const updateField = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

    const handleSave = async () => {
      setSaving(true);
      setErrorMessage("");
      
      // Validate required fields
      if (!userId) {
        setErrorMessage("User ID not found. Please log in again.");
        setSaving(false);
        return;
      }
      
      // Validate userId format
      if (typeof userId !== 'string' || userId.length !== 24 || !/^[0-9a-fA-F]+$/.test(userId)) {
        setErrorMessage("Invalid user ID format. Please log in again.");
        setSaving(false);
        return;
      }
      
      if (!profile.fullName || !profile.schoolName || !profile.grade) {
        setErrorMessage("Please fill in all required fields (Full Name, School/College, and Grade/Year).");
        setSaving(false);
        return;
      }
      
      try {
        // Save to backend without token authentication
        const response = await api.put("/api/auth/profile", {
          userId: userId,
          fullName: profile.fullName,
          schoolName: profile.schoolName,
          grade: profile.grade,
          bio: profile.bio,
          skillsToLearn: profile.skillsToLearn,
          skillsToTeach: profile.skillsToTeach,
          learningGoals: profile.learningGoals,
          interests: profile.interests
        });
        
        if (response.data.success) {
          // Also save to localStorage as backup
          localStorage.setItem("studentProfile", JSON.stringify(profile));
          setSavedAt(new Date().toLocaleString());
          setErrorMessage(""); // Clear any previous error messages
          
          // Refresh user data from backend to ensure profileComplete flag is updated
          const updatedUser = await refreshUserData();
          
          // Force a navigation refresh by using replace then push
          navigate("/profile/view", { replace: true });
          setTimeout(() => {
            navigate("/profile/view");
          }, 100);
        } else {
          setErrorMessage("Failed to save profile: " + response.data.message);
        }
      } catch (error) {
        console.error("Save error:", error);
        if (error.response) {
          setErrorMessage("Failed to save profile: " + (error.response.data.message || "Server error"));
        } else if (error.request) {
          setErrorMessage("Failed to save profile: No response from server. Please check your connection.");
        } else {
          setErrorMessage("Failed to save profile: " + error.message);
        }
      } finally {
        setSaving(false);
      }
    };

    const tabs = [
      { id: "basic", label: "Basic Info", icon: "👤" },
      { id: "skills", label: "Skills & Learning", icon: "🎯" },
      { id: "goals", label: "Goals", icon: "🚀" },
    ];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
              <div className="hidden sm:block text-gray-300 dark:text-slate-600">|</div>
              <Link
                to="/"
                className="inline-flex items-center space-x-1 text-gray-500 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </Link>
              <div className="hidden sm:block text-gray-300 dark:text-slate-600">|</div>
              <div className="text-sm text-gray-500 dark:text-slate-400">
                <span className="text-gray-900 dark:text-slate-100 font-medium">Profile</span>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="btn-primary px-6 py-3 text-center"
              disabled={saving}
            >
              {saving ? "Saving..." : "💾 Save Profile"}
            </button>
          </div>

          {savedAt && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
              <p className="text-green-800 dark:text-green-300 text-sm">✅ Profile saved successfully!</p>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
              <p className="text-red-800 dark:text-red-300 text-sm">❌ {errorMessage}</p>
            </div>
          )}

          {/* Welcome Message for New Users */}
          {Object.values(profile).filter(v => v.trim()).length === 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">👋</div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Welcome to BlockLearn!</h3>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    Let's set up your profile in just a few simple steps. This will help us find the best skill-swapping matches for you!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400 mb-2">
              <span>Profile Completion</span>
              <span>{Math.round((Object.values(profile).filter(v => v.trim()).length / Object.keys(profile).length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.values(profile).filter(v => v.trim()).length / Object.keys(profile).length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors flex-1 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              <section className="card">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6 flex items-center">
                  <span className="mr-2">👤</span>
                  Basic Information
                </h2>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter your full name"
                      value={profile.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      School/College *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter your school or college name"
                      value={profile.schoolName}
                      onChange={(e) => updateField("schoolName", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Grade/Year *
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Freshman, Sophomore, 1st Year, etc."
                      value={profile.grade}
                      onChange={(e) => updateField("grade", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      className="input"
                      placeholder="Tell us a little about yourself"
                      rows={4}
                      value={profile.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-6">
              <section className="card">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6 flex items-center">
                  <span className="mr-2">🎯</span>
                  Skills & Learning
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Skills you want to learn
                    </label>
                    <textarea
                      className="input"
                      placeholder="List the skills you're interested in learning (e.g., JavaScript, Python, UI/UX Design)"
                      rows={3}
                      value={profile.skillsToLearn}
                      onChange={(e) => updateField("skillsToLearn", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Skills you can teach
                    </label>
                    <textarea
                      className="input"
                      placeholder="List the skills you can teach others (e.g., Mathematics, English, Guitar)"
                      rows={3}
                      value={profile.skillsToTeach}
                      onChange={(e) => updateField("skillsToTeach", e.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "goals" && (
            <div className="space-y-6">
              <section className="card">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-6 flex items-center">
                  <span className="mr-2">🚀</span>
                  Goals & Interests
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Learning Goals
                    </label>
                    <textarea
                      className="input"
                      placeholder="What are your learning goals for the next 6 months?"
                      rows={3}
                      value={profile.learningGoals}
                      onChange={(e) => updateField("learningGoals", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Interests & Hobbies
                    </label>
                    <textarea
                      className="input"
                      placeholder="What are your interests and hobbies outside of learning?"
                      rows={3}
                      value={profile.interests}
                      onChange={(e) => updateField("interests", e.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error in StudentProfile:", error);
    // Redirect to login page if there's an error
    return <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">Something went wrong</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-6">Please try refreshing the page or logging in again.</p>
        <button 
          onClick={() => navigate("/login")}
          className="btn-primary px-6 py-3"
        >
          Go to Login
        </button>
      </div>
    </div>;
  }
};

export default StudentProfile;