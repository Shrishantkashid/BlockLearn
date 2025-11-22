import React, { useState } from 'react';
import JitsiMeetComponent from '../components/JitsiMeetComponent';

const JitsiTestPage = () => {
  const [roomName, setRoomName] = useState('test-room-123');
  const [userName, setUserName] = useState('Test User');
  const [userType, setUserType] = useState('mentor');
  const [showJitsi, setShowJitsi] = useState(false);

  const handleMeetingEnd = () => {
    console.log('Meeting ended');
    setShowJitsi(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Jitsi Integration Test</h1>
        
        {!showJitsi ? (
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Configure Jitsi Meeting</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter room name"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">User Type</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="mentor">Mentor</option>
                  <option value="student">Student</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowJitsi(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Start Jitsi Meeting
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 h-[70vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Jitsi Meeting: {roomName}</h2>
              <button
                onClick={() => setShowJitsi(false)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Close Meeting
              </button>
            </div>
            
            <div className="h-[calc(100%-4rem)]">
              <JitsiMeetComponent 
                roomName={roomName}
                userName={userName}
                userType={userType}
                onMeetingEnd={handleMeetingEnd}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JitsiTestPage;