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

export default function AdminInterviewSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const isComponentMountedRef = useRef(false);
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
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
  
  // Show notification popup
  const showNotificationPopup = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Initialize socket connection and media
  useEffect(() => {
    console.log('Component mounting, initializing socket and media');
    isComponentMountedRef.current = true;
    
    initializeSocket();
    initializeMedia();

    // Cleanup function
    return () => {
      console.log('Cleaning up AdminInterviewSession component');
      isComponentMountedRef.current = false;
      
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (e) {
          console.log('Error disconnecting socket:', e);
        }
        socketRef.current = null;
      }
      
      if (localStream) {
        try {
          localStream.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.log('Error stopping tracks:', e);
        }
        setLocalStream(null);
      }
    };
  }, []);

  const initializeSocket = () => {
    // Connect to the React-webRTC signaling server with better error handling
    socketRef.current = io("http://localhost:8000", {
      transports: ['websocket', 'polling'],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 10000,
    });

    socketRef.current.on("connect", () => {
      console.log(`Socket Connected`, socketRef.current.id);
      // Join the room with the interview code
      socketRef.current.emit("room:join", { email: "admin@" + code, room: code });
    });

    socketRef.current.on("room:join", (data) => {
      console.log("Room joined", data);
      showNotificationPopup('Joined interview room');
    });

    socketRef.current.on("user:joined", ({ email, id }) => {
      console.log(`User ${email} joined room with id ${id}`);
      showNotificationPopup(`${email} joined the room`);
      setRemoteSocketId(id);
      
      // If we have a local stream, initiate a call after a short delay
      // If we don't have a local stream yet, the initializeMedia function will handle it
      if (localStream) {
        console.log("Initiating call to newly joined user");
        setTimeout(() => {
          handleCallUser();
        }, 1500);
      } else {
        console.log("Local stream not ready yet, will call when ready");
      }
    });

    socketRef.current.on("incomming:call", ({ from, offer }) => {
      console.log("Incoming call from", from, "with offer", offer);
      setRemoteSocketId(from);
      
      // Handle incoming call
      handleIncomingCall({ from, offer });
    });

    socketRef.current.on("call:accepted", ({ from, ans }) => {
      console.log("Call accepted by", from, "with answer", ans);
      console.log("Setting local description with answer");
      peer.setLocalDescription(ans);
      setIsConnected(true);
      showNotificationPopup('Call connected');
      
      // Send our stream
      console.log("Sending streams after call acceptance");
      setTimeout(() => {
        sendStreams();
      }, 1000);
    });

    socketRef.current.on("peer:nego:needed", ({ from, offer }) => {
      console.log("Peer negotiation needed from", from, "with offer", offer);
      handlePeerNegotiationNeeded({ from, offer });
    });

    socketRef.current.on("peer:nego:final", ({ from, ans }) => {
      console.log("Peer negotiation final from", from, "with answer", ans);
      peer.setLocalDescription(ans);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to signaling server. Please make sure the React-webRTC server is running on port 8000.');
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
        console.log('Component unmounted during async operation, stopping stream tracks');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      console.log('Media stream acquired:', stream);
      console.log('Stream active:', stream.active);
      console.log('Stream tracks:', stream.getTracks());
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        console.log('Setting local video srcObject');
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(error => {
          console.log('Auto-play prevented for local video:', error);
        });
      }
      
      // If there's already a remote user connected, initiate a call
      if (remoteSocketId) {
        console.log("Remote user already connected, initiating call");
        setTimeout(() => {
          handleCallUser();
        }, 2000);
      } else {
        console.log("No remote user connected yet");
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
      console.log("remoteSocketId:", remoteSocketId, "localStream:", localStream);
      return;
    }
    
    console.log("Calling user", remoteSocketId);
    try {
      console.log("Creating offer");
      const offer = await peer.getOffer();
      console.log("Offer created:", offer);
      console.log("Sending offer to", remoteSocketId);
      socketRef.current.emit("user:call", { to: remoteSocketId, offer });
      console.log("Offer sent successfully");
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }, [remoteSocketId, localStream]);

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    console.log("Handling incoming call from", from, "with offer", offer);
    setRemoteSocketId(from);
    
    // Only get media stream if we don't have one yet
    let stream = localStream;
    if (!stream) {
      console.log("Getting media stream for incoming call");
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
    } else {
      console.log("Using existing media stream");
    }
    
    console.log(`Creating answer for incoming call`);
    const ans = await peer.getAnswer(offer);
    console.log("Answer created:", ans);
    socketRef.current.emit("call:accepted", { to: from, ans });
    console.log("Answer sent successfully");
    
    // Send our streams after accepting the call
    setTimeout(() => {
      console.log("Sending streams after accepting incoming call");
      sendStreams();
    }, 1500);
  }, [localStream]);

  const sendStreams = useCallback(() => {
    if (!localStream || !peer || !peer.peer) {
      console.log("Cannot send streams: missing localStream or peer connection");
      console.log("localStream:", localStream, "peer:", peer);
      return;
    }
    
    console.log("Sending streams to peer connection");
    try {
      const tracks = localStream.getTracks();
      console.log("Tracks to send:", tracks);
      for (const track of tracks) {
        console.log("Adding track to peer connection:", track);
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
    if (!peer || !peer.peer) {
      console.log("Cannot set up peer connection listeners: peer not available");
      console.log("peer:", peer);
      return;
    }
    
    const handleTrack = async (ev) => {
      console.log("Received track event:", ev);
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!", remoteStream);
      
      if (remoteStream && remoteStream[0]) {
        console.log("Setting remote stream");
        setRemoteStream(remoteStream[0]);
        
        if (remoteVideoRef.current) {
          console.log("Setting remote video srcObject");
          remoteVideoRef.current.srcObject = remoteStream[0];
          remoteVideoRef.current.play().catch(error => {
            console.log('Auto-play prevented for remote video:', error);
          });
        }
        
        console.log("Setting connected state to true");
        setIsConnected(true);
      } else {
        console.log("No valid remote stream received");
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
    
    navigate('/admin/dashboard');
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-b-2 border-white rounded-full animate-spin"></div>
          <p className="text-xl text-white">Connecting to interview session...</p>
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
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
            >
              Back to Dashboard
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
            <h1 className="text-xl font-bold text-white">Admin Interview Session</h1>
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
        <div className={`${showChat ? 'w-3/4' : 'flex-1'} relative`}>
          <div className="flex items-center justify-center h-full bg-black">
            <div className="relative flex items-center justify-center w-full h-full">
              {/* Remote Video Container */}
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-800 border-2 border-gray-700 rounded-lg">
                  <div className="text-center">
                    <div className="relative">
                      <div className="flex items-center justify-center w-32 h-32 mx-auto mb-4 bg-gray-700 rounded-full">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                      {!isConnected && !remoteSocketId && (
                        <div className="absolute flex items-center px-2 py-1 text-xs text-white transform -translate-x-1/2 bg-yellow-500 rounded -bottom-2 left-1/2">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Waiting
                        </div>
                      )}
                      {(isConnected || remoteSocketId) && (
                        <div className="absolute flex items-center px-2 py-1 text-xs text-white transform -translate-x-1/2 bg-green-500 rounded -bottom-2 left-1/2">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </div>
                      )}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-white">Mentor</h3>
                    <p className="mb-4 text-gray-400">
                      {(isConnected || remoteSocketId) ? 'Video feed will appear here' : 'Waiting for mentor to join...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Show Admin's video as overlay */}
              <div className="absolute w-1/4 max-w-xs bottom-4 right-4">
                <div className="relative overflow-hidden bg-black border-2 border-gray-700 rounded-lg">
                  {localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-700">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute flex space-x-2 top-2 left-2">
                    <div className={`h-3 w-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div className={`h-3 w-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  </div>
                  <div className="absolute px-2 py-1 text-xs text-white rounded bottom-2 left-2 bg-black/50">
                    You (Admin)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="flex flex-col w-1/4 bg-gray-800 border-l border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Chat</h2>
            </div>
            
            <div id="messages-container" className="flex-1 p-4 space-y-3 overflow-y-auto">
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
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
          </button>
          
          <button
            onClick={endCall}
            className="p-3 transition-colors bg-red-500 rounded-full hover:bg-red-600"
            title="End call"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
