import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  isWebRTCSupported,
  getMediaConstraints,
  createPeerConnection,
  addStreamToPeerConnection,
  handleWebRTCError,
  closeConnection
} from "../utils/webrtcUtils";
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  User, 
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function InterviewSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const isComponentMountedRef = useRef(false);
  const isInitializingRef = useRef(false);
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [members, setMembers] = useState([]);
  const [isCalling, setIsCalling] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState({ name: 'Admin', hasVideo: false });
  
  // Show notification popup
  const showNotificationPopup = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Check WebRTC support on mount
  useEffect(() => {
    if (!isWebRTCSupported()) {
      setError('WebRTC is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      setLoading(false);
      return;
    }
  }, []);

  // Initialize socket connection and media
  useEffect(() => {
    // Prevent double mounting in development mode
    if (isComponentMountedRef.current) {
      console.log('Component already mounted, skipping initialization');
      return;
    }

    isComponentMountedRef.current = true;
    console.log('Component mounting, initializing socket and media');

    initializeSocket();
    initializeMedia();

    // Cleanup function
    return () => {
      console.log('Cleaning up InterviewSession component');
      isComponentMountedRef.current = false;

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
        });
        setLocalStream(null);
      }
      isInitializingRef.current = false;
    };
  }, []);

  const initializeSocket = () => {
    // Determine the backend URL based on environment
    const backendUrl = import.meta.env.VITE_API_URL ||
                      (window.location.hostname.includes('vercel.app')
                        ? `https://${window.location.hostname}`
                        : 'http://localhost:5000');

    console.log('Connecting to signaling server at:', backendUrl);

    // Connect to the unified signaling server with improved configuration
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      path: '/socket.io',
      upgrade: false,
      rememberUpgrade: false,
      forceNew: true,
      rejectUnauthorized: false
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server with ID:', socketRef.current.id);
      socketRef.current.emit('join-room', code);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to signaling server. Please try again.');
    });

    // Handle offer from admin
    socketRef.current.on('offer', async (data) => {
      console.log('Received offer:', data);
      try {
        setCaller(data.sender); // Set the caller to the sender of the offer
        setIsCalling(true);

        if (peerConnectionRef.current) {
          console.log('Creating answer for offer from:', data.sender);
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          if (socketRef.current) {
            socketRef.current.emit('answer', {
              roomId: code,
              answer: answer
            });
            console.log('Answer broadcast to room for admin-mentor call');
          }
        }
      } catch (error) {
        handleWebRTCError(error, 'handling offer');
      }
    });

    // Handle answer from admin
    socketRef.current.on('answer', async (data) => {
      console.log('Received answer:', data);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallAccepted(true);
          setIsConnected(true);
          showNotificationPopup('Admin joined the interview session');
          setOtherParticipant(prev => ({ ...prev, hasVideo: true }));
          console.log('Answer received and processed, isConnected set to true');

          if (remoteVideoRef.current && Object.keys(remoteStreams).length > 0) {
            remoteVideoRef.current.play().catch(error => {
              console.log('Auto-play prevented for remote video:', error);
            });
          }
        } catch (error) {
          handleWebRTCError(error, 'handling answer');
        }
      }
    });

    // Handle ICE candidate
    socketRef.current.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate:', data);
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          handleWebRTCError(error, 'adding ICE candidate');
        }
      }
    });

    // Handle admin joined
    socketRef.current.on('user-joined', (userId) => {
      console.log('Admin joined:', userId);
      setMembers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });

      showNotificationPopup('Admin joined the room');

      // Update connection status if we have remote streams
      if (Object.keys(remoteStreams).length > 0) {
        setIsConnected(true);
      }

      // Create offer immediately when admin joins (admin-mentor 1-on-1 logic)
      console.log('Admin-mentor call detected, creating offer immediately for user:', userId);
      setTimeout(() => {
        if (isComponentMountedRef.current && localStream && peerConnectionRef.current) {
          createOffer(userId);
        }
      }, 500);
    });

    // Handle admin left
    socketRef.current.on('user-left', (userId) => {
      console.log('Admin left:', userId);
      setIsConnected(false);
      setCallAccepted(false);
      setIsCalling(false);
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams['remote']; // Remove the remote stream
        return newStreams;
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      showNotificationPopup('Admin left the room');
      setOtherParticipant(prev => ({ ...prev, hasVideo: false }));
      setMembers(prev => prev.filter(member => member !== userId));
      console.log('Admin left, isConnected set to false');
    });

    // Handle chat messages
    socketRef.current.on('message', (data) => {
      console.log('Received message:', data);
      if (data && data.message) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: data.message.text || '',
          sender: data.sender || data.message.sender || '',
          timestamp: data.message.timestamp || new Date().toLocaleTimeString(),
          isOwn: (data.sender || data.message.sender) === socketRef.current.id
        }]);
      }
    });
  };

  const initializeMedia = async () => {
    try {
      console.log('Initializing media devices...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      if (!isComponentMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      console.log('Media stream acquired:', stream);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(error => {
          console.log('Auto-play prevented for local video:', error);
        });
      }
      
      // If there's already a remote user connected, initiate a call
      if (remoteSocketId) {
        setTimeout(() => {
          handleCallUser();
        }, 1000);
      }
      
      setLoading(false);
    } catch (error) {
      if (isComponentMountedRef.current) {
        console.error('Error accessing media devices:', error);
        setError('Failed to access camera/microphone. Please check permissions.');
      }
      setLoading(false);
    }
  };

  const handleCallUser = useCallback(async () => {
    if (!remoteSocketId || !localStream) {
      console.log("Cannot call user: missing remoteSocketId or localStream");
      return;
    }
    
    console.log("Calling user", remoteSocketId);
    try {
      console.log("Creating offer");
      const offer = await peer.getOffer();
      console.log("Sending offer to", remoteSocketId);
      socketRef.current.emit("user:call", { to: remoteSocketId, offer });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }, [remoteSocketId, localStream]);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setRemoteSocketId(from);
    
    // Only get media stream if we don't have one yet
    let stream = localStream;
    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(error => {
          console.log('Auto-play prevented for local video:', error);
        });
      }
    }
    
    console.log(`Incoming Call`, from, offer);
    const ans = await peer.getAnswer(offer);
    socketRef.current.emit("call:accepted", { to: from, ans });
    
    // Send our streams after accepting the call
    setTimeout(() => {
      sendStreams();
    }, 1000);
  }, [localStream]);

  const sendStreams = useCallback(() => {
    if (!localStream || !peer || !peer.peer) {
      console.log("Cannot send streams: missing localStream or peer connection");
      return;
    }
    
    console.log("Sending streams to peer connection");
    try {
      for (const track of localStream.getTracks()) {
        peer.peer.addTrack(track, localStream);
      }
      console.log("Streams sent successfully");
    } catch (error) {
      console.error("Error sending streams:", error);
    }
  }, [localStream]);

  const handlePeerNegotiationNeeded = useCallback(async () => {
    if (!remoteSocketId) return;
    
    const offer = await peer.getOffer();
    socketRef.current.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId]);

  // Set up peer connection event listeners
  useEffect(() => {
    if (!peer || !peer.peer) return;
    
    const handleTrack = async (ev) => {
      console.log("Received track event:", ev);
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!", remoteStream);
      
      if (remoteStream && remoteStream[0]) {
        setRemoteStream(remoteStream[0]);
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream[0];
          remoteVideoRef.current.play().catch(error => {
            console.log('Auto-play prevented for remote video:', error);
          });
        }
        
        setIsConnected(true);
      }
    };
    
    const handleNegotiationNeeded = async () => {
      console.log("Negotiation needed");
      handlePeerNegotiationNeeded();
    };
    
    console.log("Adding event listeners to peer connection");
    peer.peer.addEventListener("track", handleTrack);
    peer.peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
    
    return () => {
      console.log("Removing event listeners from peer connection");
      peer.peer.removeEventListener("track", handleTrack);
      peer.peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
    };
  }, [handlePeerNegotiationNeeded]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      
      if (!isVideoOff) {
        videoTracks.forEach(track => {
          track.enabled = false;
        });
        setIsVideoOff(true);
      } else {
        videoTracks.forEach(track => {
          track.enabled = true;
        });
        setIsVideoOff(false);
      }
    }
  };

  const endCall = () => {
    // Clean up WebRTC connection
    if (peer && peer.peer) {
      try {
        peer.peer.close();
      } catch (e) {
        console.log('Error closing peer connection:', e);
      }
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    navigate('/dashboard');
  };

  const sendMessage = () => {
    // For now, we'll just add to local messages since we don't have a chat server
    if (newMessage.trim()) {
      const messageData = {
        text: newMessage,
        sender: "You",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: newMessage,
        sender: messageData.sender,
        timestamp: messageData.timestamp,
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

  // Scroll to bottom of messages
  useEffect(() => {
    const messagesContainer = document.getElementById("messages-container");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Connecting to interview session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <PhoneOff className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Connection Error</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/interview/code-entry')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
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
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-gray-800 border-l-4 border-green-500 text-white p-4 rounded shadow-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Interview Session</h1>
            <p className="text-gray-300 text-sm">
              Code: {code}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
            <button 
              onClick={() => setShowChat(!showChat)}
              className="ml-4 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 h-[calc(100vh-120px)]">
        {/* Video Area - Modified for Mentor View */}
        <div className={`${showChat ? 'w-3/4' : 'flex-1'} relative`}>
          {/* Show Admin's video as main view for mentor */}
          <div className="h-full bg-black flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Remote Video Container */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full"
                />
              ) : (
                <div className="bg-gray-800 border-2 border-gray-700 rounded-lg w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative">
                      <div className="bg-gray-700 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                      {!isConnected && !remoteSocketId && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Waiting
                        </div>
                      )}
                      {(isConnected || remoteSocketId) && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Admin</h3>
                    <p className="text-gray-400 mb-4">
                      {(isConnected || remoteSocketId) ? 'Video feed will appear here' : 'Waiting for admin to join...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Show Mentor's video as overlay for mentor */}
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 border-2 border-gray-700 rounded-lg overflow-hidden">
                <div className="relative w-full h-full">
                  {localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gray-700 w-full h-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    You (Mentor)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-lg">Chat</h2>
            </div>
            
            <div id="messages-container" className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2" />
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
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm transition-colors flex items-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6 text-white" /> : <Video className="h-6 w-6 text-white" />}
          </button>
          
          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            title="End call"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
