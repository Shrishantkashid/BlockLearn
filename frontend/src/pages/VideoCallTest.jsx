import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCall from '../components/VideoCall';

export default function VideoCallTest() {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [userType, setUserType] = useState('mentor');
  const [startCall, setStartCall] = useState(false);

  const handleEndCall = () => {
    setStartCall(false);
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
        showInterviewDetails={userType !== 'participant'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Video Call Test</h1>
        
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
              User Type
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
              <option value="participant">Participant</option>
            </select>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Start Call
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}