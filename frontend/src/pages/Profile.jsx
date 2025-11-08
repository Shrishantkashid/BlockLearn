import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save, User, Mail, Phone, MapPin } from "lucide-react";
import api from "../api";

function Profile() {
  const [userData, setUserData] = useState({
    displayName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    skills: [],
    experience: "",
    education: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        navigate("/login");
        return;
      }
      
      // First get the current user data
      const response = await api.get('/api/auth/me');
      
      if (response.data.success) {
        const user = response.data.user;
        // Then get the detailed profile data
        const profileResponse = await api.get(`/api/auth/profile/${user.id}`);
        
        if (profileResponse.data.success) {
          const profileData = profileResponse.data.profile || {};
          setUserData({
            displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email || "",
            phone: profileData.phone || "",
            location: profileData.location || profileData.school_name || "",
            bio: profileData.bio || "",
            skills: profileData.skills_to_learn || [],
            experience: profileData.experience || "",
            education: profileData.education || profileData.school_name || ""
          });
        } else {
          // If no detailed profile, use basic user data
          setUserData({
            displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email || "",
            phone: "",
            location: "",
            bio: "",
            skills: [],
            experience: "",
            education: ""
          });
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(",").map(skill => skill.trim()).filter(skill => skill);
    setUserData(prev => ({
      ...prev,
      skills: skills
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      // First get the current user to get their ID
      const userResponse = await api.get('/api/auth/me');
      if (!userResponse.data.success) {
        throw new Error("Failed to get user data");
      }
      
      const userId = userResponse.data.user.id;
      
      // Save to backend with the correct structure
      const profileData = {
        userId: userId,
        fullName: userData.displayName,
        phone: userData.phone,
        location: userData.location,
        bio: userData.bio,
        skillsToLearn: userData.skills,
        experience: userData.experience,
        education: userData.education
      };
      
      const response = await api.put('/api/auth/profile', profileData);
      
      if (response.data.success) {
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(response.data.message || "Failed to save profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-700 dark:text-green-300">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Profile Picture Section */}
              <div className="md:col-span-1">
                <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-6 text-center">
                  <div className="mx-auto bg-gray-200 dark:bg-slate-600 border-2 border-dashed rounded-full w-24 h-24 flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-gray-400 dark:text-slate-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {userData.displayName || "No Name"}
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">
                    {userData.email}
                  </p>
                </div>
              </div>

              {/* Profile Details Section */}
              <div className="md:col-span-2">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="displayName"
                          value={userData.displayName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            disabled
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={userData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            name="location"
                            value={userData.location}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">About</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={userData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Skills to Learn</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Skills (comma separated)
                      </label>
                      <input
                        type="text"
                        value={userData.skills.join(", ")}
                        onChange={handleSkillsChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., JavaScript, React, Node.js"
                      />
                    </div>
                  </div>

                  {/* Experience & Education */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Experience
                      </label>
                      <input
                        type="text"
                        name="experience"
                        value={userData.experience}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Your experience"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        Education
                      </label>
                      <input
                        type="text"
                        name="education"
                        value={userData.education}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Your education"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;