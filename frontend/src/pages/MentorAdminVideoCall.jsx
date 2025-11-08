import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import VideoCall from "../components/VideoCall";

export default function MentorAdminVideoCall() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse URL parameters
  const queryParams = new URLSearchParams(location.search);
  const roomId = queryParams.get('roomId');
  const userTypeParam = queryParams.get('userType');
  
  const [sessionCode, setSessionCode] = useState(roomId || '');
  const [userType, setUserType] = useState(userTypeParam || 'mentor');
  const [startCall, setStartCall] = useState(false);

  // If roomId and userType are provided in URL, automatically start the call
  useEffect(() => {
    if (roomId && userTypeParam) {
      setStartCall(true);
    }
  }, [roomId, userTypeParam]);

  const handleEndCall = () => {
    setStartCall(false);
    // Navigate back to landing page
    navigate('/mentor-admin-landing');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sessionCode.trim()) {
      setStartCall(true);
    }
  };

  if (startCall) {
    return (
      <VideoCall 
        code={sessionCode}
        userType={userType}
        onEndCall={handleEndCall}
        showSidebar={true}
        showInterviewDetails={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Mentor-Admin Video Call</h1>
        <p className="text-gray-400 mb-6 text-center">
          Join a video call session as either a mentor or admin
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Code
            </label>
            <input
              type="text"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter session code"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User Role
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Join Call
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/mentor-admin-landing')}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <h2 className="text-lg font-medium text-white mb-4">Instructions</h2>
          <ol className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">1.</span>
              <span>Enter the same session code on both mentor and admin devices</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">2.</span>
              <span>Select the appropriate role for each participant</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              <span>Allow camera and microphone access when prompted</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">4.</span>
              <span>Audio and video will be exchanged between participants</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}