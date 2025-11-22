import React, { useState, useEffect } from "react";
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  User, 
  Calendar,
  MessageSquare,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Send,
  MessageCircle
} from "lucide-react";
import JitsiMeetComponent from "./JitsiMeetComponent";

export default function VideoCall({
  code,
  userType,
  onEndCall,
  showSidebar = true,
  showInterviewDetails = true
}) {
  // Check if this is a mentor-student session (not an interview)
  const isMentorStudentSession = !showInterviewDetails;

  // Check if this is a mentor-admin call (1-on-1)
  const isMentorAdminCall = userType === 'mentor' || userType === 'admin';

  // State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [otherParticipant, setOtherParticipant] = useState({ name: 'Participant', hasVideo: false });

  // Show notification popup
  const showNotificationPopup = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Handle meeting end
  const handleMeetingEnd = () => {
    if (onEndCall) {
      onEndCall();
    }
  };

  // Handle participant joined
  const handleParticipantJoined = () => {
    setIsConnected(true);
    setMembers(prev => [...prev, 'participant']);
    const role = userType === 'admin' ? 'Mentor' : 'Admin';
    showNotificationPopup(`${role} joined the room`);
  };

  // Handle participant left
  const handleParticipantLeft = () => {
    setIsConnected(false);
    setMembers([]);
    const role = userType === 'admin' ? 'Mentor' : 'Admin';
    showNotificationPopup(`${role} left the room`);
    setOtherParticipant(prev => ({ ...prev, hasVideo: false }));
  };

  const toggleMute = () => {
    // This will be handled by Jitsi UI
    console.log('Toggle mute - handled by Jitsi');
  };

  const toggleVideo = () => {
    // This will be handled by Jitsi UI
    console.log('Toggle video - handled by Jitsi');
  };

  const endCall = () => {
    // This will be handled by Jitsi UI
    handleMeetingEnd();
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: newMessage,
        sender: 'You',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true
      }]);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-white rounded-full animate-spin"></div>
          <p className="text-xl text-white">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-full max-w-md p-8 mx-4 bg-white rounded-lg shadow-lg dark:bg-slate-800">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
              <PhoneOff className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100">Connection Error</h3>
            <p className="mb-6 text-gray-600 dark:text-slate-400">{error}</p>
            <button
              onClick={endCall}
              className="px-4 py-2 text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Notification Popup */}
      {showNotification && (
        <div className="fixed z-50 top-4 right-4">
          <div className="flex items-center p-4 text-white bg-gray-800 border-l-4 border-green-500 rounded shadow-lg">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {isMentorStudentSession 
                ? 'Mentor-Student Session' 
                : userType === 'admin' ? 'Admin Interview Session' : 'Interview Session'}
            </h1>
            <p className="text-sm text-gray-300">
              Code: {code}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-white">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
            <button 
              onClick={() => setShowChat(!showChat)}
              className="p-2 ml-4 transition-colors bg-gray-700 rounded-full hover:bg-gray-600"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 h-[calc(100vh-120px)]">
        {/* Video Area */}
        <div className={`${showSidebar || showChat ? 'w-3/4' : 'flex-1'} relative`}>
          <div className="flex items-center justify-center h-full bg-black">
            <div className="relative flex items-center justify-center w-full h-full">
              {/* Jitsi Meet Component */}
              <JitsiMeetComponent 
                roomName={code}
                userName={userType === 'admin' ? 'Admin' : userType === 'mentor' ? 'Mentor' : 'Student'}
                userType={userType}
                onMeetingEnd={handleMeetingEnd}
              />
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="flex flex-col w-1/4 bg-gray-800 border-l border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Chat</h2>
            </div>
            
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.isOwn
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.isOwn ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="flex items-center px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        {showSidebar && !showChat && (
          <div className="flex flex-col bg-gray-800 border-l border-gray-700 w-80">
            {/* Member List */}
            <div className="p-4 border-b border-gray-700">
              <h2 className="flex items-center mb-3 text-lg font-semibold">
                <Users className="w-5 h-5 mr-2" />
                Participants ({members.length + 1})
              </h2>
              <div className="space-y-2">
                <div className="flex items-center p-2 space-x-2 bg-gray-700 rounded">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">
                    You ({isMentorStudentSession 
                      ? (userType === 'mentor' ? 'Mentor' : 'Student')
                      : userType})
                  </span>
                  <div className="w-2 h-2 ml-auto bg-green-500 rounded-full"></div>
                </div>
                {members.map((memberId, index) => (
                  <div key={memberId} className="flex items-center p-2 space-x-2 rounded hover:bg-gray-700">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm">
                      {isMentorStudentSession 
                        ? (userType === 'mentor' ? 'Student' : 'Mentor')
                        : (userType === 'admin' ? 'Mentor' : 'Admin')} {index + 1}
                    </span>
                    <div className="w-2 h-2 ml-auto bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Interview Details */}
            {showInterviewDetails && (
              <div className="p-4 border-b border-gray-700">
                <h2 className="mb-3 text-lg font-semibold">Session Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {isMentorStudentSession
                        ? (userType === 'mentor' ? 'Session Participant' : 'Session Host')
                        : (userType === 'admin' ? 'Interview Candidate' : 'Interviewer')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Today</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">30 minutes</span>
                  </div>
                </div>
                
                {!isMentorStudentSession && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-sm font-medium">Skills to Demonstrate</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                        JavaScript
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                        React
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary">
                        Node.js
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Interview Guidelines */}
            {showInterviewDetails && (
              <div className="p-4">
                <h2 className="mb-3 text-lg font-semibold">Guidelines</h2>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mt-0.5 mr-2 text-green-500" />
                    <span>Arrive on time and test your equipment before the interview</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mt-0.5 mr-2 text-green-500" />
                    <span>Have a stable internet connection</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mt-0.5 mr-2 text-green-500" />
                    <span>Prepare examples of your teaching methodology</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mt-0.5 mr-2 text-green-500" />
                    <span>Be ready to demonstrate your skills in a practical exercise</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={toggleMute}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Toggle microphone"
          >
            <Mic className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={toggleVideo}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Toggle camera"
          >
            <Video className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            title="End call"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
