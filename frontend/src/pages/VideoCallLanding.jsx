import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Video, User } from "lucide-react";

function VideoCallLanding() {
  const [roomId, setRoomId] = useState("");
  const [userType, setUserType] = useState("participant");
  const navigate = useNavigate();

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
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
          <h1 className="text-2xl font-bold text-white mb-2">Multi-User Video Call</h1>
          <p className="text-gray-400">Join or create a video call room</p>
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
                placeholder="Enter room ID"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={generateRandomRoom}
                className="bg-gray-600 hover:bg-gray-500 text-white rounded-lg px-4 py-2 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUserType("participant")}
                className={`p-3 rounded-lg flex flex-col items-center ${
                  userType === "participant"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <User className="h-5 w-5 mb-1" />
                <span className="text-xs">Participant</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType("mentor")}
                className={`p-3 rounded-lg flex flex-col items-center ${
                  userType === "mentor"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <User className="h-5 w-5 mb-1" />
                <span className="text-xs">Mentor</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType("admin")}
                className={`p-3 rounded-lg flex flex-col items-center ${
                  userType === "admin"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <User className="h-5 w-5 mb-1" />
                <span className="text-xs">Admin</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!roomId.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Join Room
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
              <span>Share the room ID with others to invite them</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">3.</span>
              <span>Allow camera and microphone access when prompted</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">4.</span>
              <span>Use the member list to see who's in the room</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default VideoCallLanding;