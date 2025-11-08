import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Video, User, Shield } from "lucide-react";

export default function MentorAdminCallLanding() {
  const [roomId, setRoomId] = useState("");
  const [userType, setUserType] = useState("mentor");
  const navigate = useNavigate();

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/mentor-admin-call?roomId=${roomId.trim()}&userType=${userType}`);
    }
  };

  const generateRandomRoom = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    setRoomId(randomId);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-500 mb-4">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Mentor-Admin Video Call</h1>
          <p className="text-gray-400">Secure video conferencing for mentors and admins</p>
        </div>

        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter room ID"
                required
              />
              <button
                type="button"
                onClick={generateRandomRoom}
                className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                title="Generate random room ID"
              >
                <Shield className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("mentor")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                  userType === "mentor"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <User className="h-6 w-6 mb-2 text-blue-400" />
                <span className="text-white font-medium">Mentor</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType("admin")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                  userType === "admin"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <Shield className="h-6 w-6 mb-2 text-blue-400" />
                <span className="text-white font-medium">Admin</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!roomId.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Join Video Call
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <h2 className="text-lg font-medium text-white mb-4">How to use</h2>
          <ol className="text-gray-400 text-sm space-y-2">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">1.</span>
              <span>Create or join a room using a room ID</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">2.</span>
              <span>Select your role (Mentor or Admin)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              <span>Share the room ID with the other participant</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">4.</span>
              <span>Allow camera and microphone access when prompted</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}