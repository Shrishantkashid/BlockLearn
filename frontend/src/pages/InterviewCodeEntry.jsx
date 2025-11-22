import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Import the api service

function InterviewCodeEntry() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(null);
  const navigate = useNavigate();

  // Get user type on component mount
  useEffect(() => {
    const getUserType = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (response.data.success && response.data.user) {
          setUserType(response.data.user.userType);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    
    getUserType();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use the appropriate endpoint based on user type
      let response;
      if (userType === 'admin') {
        // Use admin endpoint for admins
        response = await api.get(`/api/admin/validate-interview-code/${code}`);
      } else {
        // Use general endpoint for others
        response = await api.get(`/api/auth/validate-interview-code/${code}`);
      }
      
      if (response.data.success) {
        // Determine which meeting link to use based on user type
        let meetingLink;
        if (userType === 'admin' && response.data.adminMeetingLink) {
          meetingLink = response.data.adminMeetingLink;
        } else {
          meetingLink = response.data.meetingLink;
        }
        
        // Redirect to the appropriate meeting link
        window.location.href = meetingLink;
      } else {
        setError(response.data.message || "Invalid interview code");
      }
    } catch (err) {
      console.error("Error validating interview code:", err);
      if (err.response && err.response.status === 400) {
        setError("This interview session has already passed or is invalid.");
      } else if (err.response && err.response.status === 404) {
        setError("Invalid interview code. Please check the code and try again.");
      } else {
        setError("Failed to validate interview code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Interview Session
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Enter your interview code to join the session
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Interview Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-700 dark:text-slate-100"
              maxLength={8}
              required
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Enter the 8-character code sent to your email
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 8}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating...
              </span>
            ) : (
              "Join Interview"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-slate-400 text-center">
            Didn't receive your code? Check your email or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InterviewCodeEntry;