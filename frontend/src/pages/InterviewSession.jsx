import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
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
  Users
} from "lucide-react";

export default function InterviewSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  
  // WebRTC configuration
  const configuration = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
    ]
  };

  // Initialize socket connection and media
  useEffect(() => {
    initializeSocket();
    initializeMedia();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [code]);

  // Add effect to handle socket reconnection
  useEffect(() => {
    if (!socketRef.current) return;

    const handleReconnect = () => {
      console.log('Socket reconnected, rejoining room:', code);
      socketRef.current.emit('join-room', code);
    };

    const handleReconnectAttempt = (attemptNumber) => {
      console.log('Socket reconnect attempt:', attemptNumber);
    };

    socketRef.current.on('reconnect', handleReconnect);
    socketRef.current.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('reconnect', handleReconnect);
        socketRef.current.off('reconnect_attempt', handleReconnectAttempt);
      }
    };
  }, [code]);

  const initializeSocket = () => {
    // Connect to the signaling server with proper configuration
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
      path: '/socket.io',
      upgrade: false,
      rememberUpgrade: false,
      // Add additional options to prevent frame header issues
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      // Ensure no extra headers that might cause issues
      extraHeaders: {}
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server with ID:', socketRef.current.id);
      // Join the room with the interview code
      socketRef.current.emit('join-room', code);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to signaling server. Please try again.');
    });

    // Handle offer from another peer
    socketRef.current.on('offer', async (data) => {
      console.log('Received offer:', data);
      try {
        setCaller(data);
        setIsCalling(true);
        
        // Create an answer when we receive an offer
        if (peerConnectionRef.current) {
          console.log('Creating answer for offer from:', data.sender);
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          if (socketRef.current) {
            socketRef.current.emit('answer', {
              target: data.sender,
              answer: answer
            });
            console.log('Answer sent to:', data.sender);
          }
        }
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Handle answer from another peer
    socketRef.current.on('answer', async (data) => {
      console.log('Received answer:', data);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallAccepted(true);
          setIsConnected(true);
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
    });

    // Handle ICE candidate
    socketRef.current.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate:', data);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    // Handle user joined
    socketRef.current.on('user-joined', (userId) => {
      console.log('User joined:', userId);
      console.log('Local stream available:', !!localStream);
      // Store the userId of the other user for later use
      setCaller(prev => {
        const newCaller = prev || { sender: userId };
        console.log('Setting caller to:', newCaller);
        return newCaller;
      });
      // If we have a local stream, we can initiate a call
      if (localStream) {
        console.log('Creating offer for user:', userId);
        setTimeout(() => {
          createOffer(userId);
        }, 1000); // Add a small delay to ensure peer connection is ready
      } else {
        console.log('Local stream not ready yet, will create offer when ready');
      }
    });

    // Handle user left
    socketRef.current.on('user-left', (userId) => {
      console.log('User left:', userId);
      setIsConnected(false);
      setCallAccepted(false);
      setIsCalling(false);
      setRemoteStream(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });
  };

  const initializeMedia = async () => {
    try {
      console.log('Initializing media devices...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      console.log('Media stream acquired:', stream);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      console.log('Creating peer connection...');
      createPeerConnection(stream);
      
      // If there's already a user in the room, initiate a call
      if (caller && caller.sender) {
        console.log('Creating offer for existing user:', caller.sender);
        setTimeout(() => {
          createOffer(caller.sender);
        }, 1000); // Add a small delay to ensure peer connection is ready
      }
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Failed to access camera/microphone. Please check permissions.');
    } finally {
      setLoading(false);
    }
  };

  const createPeerConnection = (stream) => {
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Add local stream to peer connection
    stream.getTracks().forEach(track => {
      peerConnectionRef.current.addTrack(track, stream);
    });
    
    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    
    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && caller && caller.sender) {
        console.log('Sending ICE candidate to:', caller.sender);
        socketRef.current.emit('ice-candidate', {
          target: caller.sender,
          candidate: event.candidate
        });
      }
    };
    
    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current.connectionState);
      if (peerConnectionRef.current.connectionState === 'connected') {
        setIsConnected(true);
      } else if (peerConnectionRef.current.connectionState === 'disconnected' || 
                 peerConnectionRef.current.connectionState === 'failed') {
        setIsConnected(false);
      }
    };
    
    // Handle ICE connection state changes
    peerConnectionRef.current.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnectionRef.current.iceConnectionState);
      if (peerConnectionRef.current.iceConnectionState === 'disconnected' || 
          peerConnectionRef.current.iceConnectionState === 'failed') {
        setIsConnected(false);
      }
    };
  };

  const createOffer = async (targetUserId) => {
    try {
      if (!peerConnectionRef.current) {
        console.log('Peer connection not ready yet');
        return;
      }
      
      console.log('Creating offer for:', targetUserId);
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('offer', {
          target: targetUserId,
          offer: offer
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const createAnswer = async () => {
    // This function is now handled in the offer handler
    // We keep it for backward compatibility
    console.log('createAnswer function called (should not be needed with new flow)');
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    // Clean up WebRTC connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.emit('leave-room', code);
      socketRef.current.disconnect();
    }
    navigate('/dashboard');
  };

  const acceptCall = () => {
    createAnswer();
  };

  const rejectCall = () => {
    setIsCalling(false);
    setCaller(null);
  };

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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Incoming Call Modal */}
      {isCalling && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Incoming Call</h3>
              <p className="text-gray-300 mb-6">User is calling you</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={acceptCall}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Accept
                </button>
                <button
                  onClick={rejectCall}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </div>
            </div>
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 h-[calc(100vh-120px)]">
        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Remote Video */}
          <div className="h-full bg-black flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full ${!remoteStream ? 'hidden' : ''}`}
              />
              {!remoteStream && (
                <div className="bg-gray-800 border-2 border-gray-700 rounded-lg w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Waiting for other participant...</p>
                    {code && (
                      <p className="text-gray-500 text-sm mt-2">Interview Code: {code}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      {socketRef.current && socketRef.current.connected 
                        ? 'Connected to signaling server' 
                        : 'Connecting to signaling server...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 border-2 border-gray-700 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!localStream && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Video className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-xs">Your video</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Interview Details */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="font-semibold text-lg mb-3">Interview Details</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Interview Partner</span>
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
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Skills to Demonstrate</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                  JavaScript
                </span>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                  React
                </span>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                  Node.js
                </span>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="p-4 border-t border-gray-700 mt-auto">
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleMute}
                className={`p-3 rounded-full ${
                  isMuted ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
                } transition-colors`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${
                  isVideoOff ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
                } transition-colors`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
              
              <button
                onClick={endCall}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}