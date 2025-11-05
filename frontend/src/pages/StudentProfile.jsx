import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const initialProfile = {
  // Basic Information
  fullName: "",
  schoolName: "",
  grade: "",
  bio: "",

  // Skills & Learning
  skillsToLearn: "",
  skillsToTeach: "",

  // Goals & Interests
  learningGoals: "",
  interests: "",

  // Optional (can be expanded later)
  achievements: "",
  portfolio: "",
};

export default function StudentProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const stored = localStorage.getItem("studentProfile");
    if (stored) {
      try { setProfile(JSON.parse(stored)); } catch {}
    }
  }, []);

  const updateField = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage("");
    
    // Validate required fields
    if (!profile.fullName || !profile.schoolName || !profile.grade) {
      setErrorMessage("Please fill in all required fields (Full Name, School/College, and Grade/Year).");
      setSaving(false);
      return;
    }
    
    try {
      // Save to backend
      const response = await axios.put("/api/auth/profile", profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Also save to localStorage as backup
        localStorage.setItem("studentProfile", JSON.stringify(profile));
        setSavedAt(new Date().toLocaleString());
        setErrorMessage(""); // Clear any previous error messages
        
        // Redirect to dashboard after saving
        setTimeout(() => navigate("/dashboard"), 1500);
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
                    placeholder="Enter your school name"
                    value={profile.schoolName}
                    onChange={(e) => updateField("schoolName", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Grade/Year *
                  </label>
                  <select
                    className="input"
                    value={profile.grade}
                    onChange={(e) => updateField("grade", e.target.value)}
                  >
                    <option value="">Select your grade</option>
                    <option value="9th">9th Grade</option>
                    <option value="10th">10th Grade</option>
                    <option value="11th">11th Grade</option>
                    <option value="12th">12th Grade</option>
                    <option value="College 1st Year">College 1st Year</option>
                    <option value="College 2nd Year">College 2nd Year</option>
                    <option value="College 3rd Year">College 3rd Year</option>
                    <option value="College 4th Year">College 4th Year</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    About Me (Optional)
                  </label>
                  <textarea
                    className="input min-h-24"
                    placeholder="Tell us a bit about yourself..."
                    value={profile.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    rows={3}
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
                    Skills I Want to Learn
                  </label>
                  <textarea
                    className="input min-h-24"
                    placeholder="e.g., Programming, Photography, Spanish, Guitar..."
                    value={profile.skillsToLearn}
                    onChange={(e) => updateField("skillsToLearn", e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    List the skills you're interested in learning from others
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Skills I Can Teach
                  </label>
                  <textarea
                    className="input min-h-24"
                    placeholder="e.g., Mathematics, English, Drawing, Basketball..."
                    value={profile.skillsToTeach}
                    onChange={(e) => updateField("skillsToTeach", e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    List the skills you're confident to teach others
                  </p>
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
                    My Learning Goals
                  </label>
                  <textarea
                    className="input min-h-24"
                    placeholder="What do you want to achieve through skill swapping?"
                    value={profile.learningGoals}
                    onChange={(e) => updateField("learningGoals", e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Interests & Hobbies
                  </label>
                  <textarea
                    className="input min-h-24"
                    placeholder="What are you passionate about outside of academics?"
                    value={profile.interests}
                    onChange={(e) => updateField("interests", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </section>

            {/* Blockchain Certificates Section */}
            <section className="card border-2 border-dashed border-gray-300 dark:border-slate-600">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  Blockchain Certificates
                </h3>
                <p className="text-gray-600 dark:text-slate-400 mb-4">
                  Earn blockchain-verified certificates for completed skills and view your achievements
                </p>
                <div className="flex justify-center space-x-3">
                  <Link to="/blockchain-certificates" className="btn-outline">
                    View Certificates
                  </Link>
                  <button className="btn-primary">
                    Connect Wallet to Earn
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Profile Summary */}
        <div className="mt-12 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5 rounded-xl border border-primary/20 dark:border-primary/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">Profile Summary</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
            <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-primary">{profile.fullName ? "✅" : "❌"}</div>
              <div className="text-gray-600 dark:text-slate-400">Basic Info</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-secondary">{profile.skillsToLearn || profile.skillsToTeach ? "✅" : "❌"}</div>
              <div className="text-gray-600 dark:text-slate-400">Skills</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-accent">{profile.learningGoals || profile.interests ? "✅" : "❌"}</div>
              <div className="text-gray-600 dark:text-slate-400">Goals</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">🏆</div>
              <div className="text-gray-600 dark:text-slate-400">Certificates</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Coming Soon</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Math.round((Object.values(profile).filter(v => v.trim()).length / Object.keys(profile).length) * 100)}%
              </div>
              <div className="text-gray-600 dark:text-slate-400">Complete</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}












