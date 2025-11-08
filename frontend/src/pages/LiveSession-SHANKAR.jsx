import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateLiveSessionCode } from '../api';
import { io } from 'socket.io-client';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, MessageCircle, Users, Copy, Check } from 'lucide-react';

function LiveSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  // Configuration for WebRTC
  const configuration = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
    ]
  };

  useEffect(() => {
    console.log('LiveSession component mounted with code:', code);
    if (code) {
      validateCode();
      initializeSocket();
    } else {
      setError('No session code provided');
      setLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
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
      // Add additional configuration to handle frame header issues
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      // Ensure no compression conflicts
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server with ID:', socketRef.current.id);
      // Join the room with the session code
      socketRef.current.emit('join-room', code);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to signaling server. Please try again.');
    });

    // Handle offer from another peer
    socketRef.current.on('offer', async (data) => {
      console.log('Received offer:', data);
      setCaller(data);
      setIsCalling(true);
    });

    // Handle answer from another peer
    socketRef.current.on('answer', async (data) => {
      console.log('Received answer:', data);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallAccepted(true);
        setIsConnected(true);
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
      // If we're not the caller and we have a local stream, we can initiate a call
      if (!caller && localStream) {
        createOffer(userId);
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

  const validateCode = async () => {
    try {
      setLoading(true);
      console.log('Validating session code:', code);
      const response = await validateLiveSessionCode(code);
      
      if (response.success) {
        console.log('Session code validated successfully:', response);
        setSessionData(response);
        // Initialize WebRTC connection here
        initializeConnection();
      } else {
        console.log('Session code validation failed:', response.message);
        setError(response.message || 'Invalid session code');
      }
    } catch (err) {
      console.error('Error validating code:', err);
      setError('Failed to validate session code');
    } finally {
      setLoading(false);
    }
  };

  const initializeConnection = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
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
        if (event.candidate && socketRef.current) {
          console.log('Sending ICE candidate');
          socketRef.current.emit('ice-candidate', {
            target: caller ? caller.sender : 'all',
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
      
    } catch (error) {
      console.error('Error initializing connection:', error);
      setError('Failed to access camera/microphone. Please check permissions.');
    }
  };

  const createOffer = async (targetUserId) => {
    try {
      if (!peerConnectionRef.current) return;
      
      console.log('Creating offer for:', targetUserId);
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socketRef.current.emit('offer', {
        target: targetUserId,
        offer: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const createAnswer = async () => {
    try {
      if (!peerConnectionRef.current || !caller) return;
      
      console.log('Creating answer for:', caller.sender);
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(caller.offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socketRef.current.emit('answer', {
        target: caller.sender,
        answer: answer
      });
      
      setCallAccepted(true);
      setIsConnected(true);
      setIsCalling(false);
    } catch (error) {
      console.error('Error creating answer:', error);
    }
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

  const toggleChat = () => {
    setShowChat(!showChat);
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
    navigate('/sessions');
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: 'You',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const acceptCall = () => {
    createAnswer();
  };

  const rejectCall = () => {
    setIsCalling(false);
    setCaller(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Validating session code...</p>
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
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Session Error</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/sessions')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Live Session</h1>
            {sessionData && (
              <div className="flex items-center mt-1">
                <span className="text-gray-300 text-sm mr-2">Code:</span>
                <span className="text-gray-300 text-sm font-mono">{code}</span>
                <button 
                  onClick={handleCopyCode}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Incoming Call Notification */}
      {isCalling && !callAccepted && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
              <Phone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Incoming Call</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">Someone is trying to join your session</p>
            
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
      )}

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
                      <p className="text-gray-500 text-sm mt-2">Session Code: {code}</p>
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

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-medium">Chat</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="text-sm">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-white">{message.sender}</span>
                        <span className="text-gray-400 text-xs ml-2">{message.timestamp}</span>
                      </div>
                      <p className="text-gray-300">{message.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={sendMessage}
                  className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-primary/90 transition-colors"
                >
                  Send
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
            onClick={toggleChat}
            className={`p-3 rounded-full ${showChat ? 'bg-primary' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
            title="Toggle chat"
          >
            <MessageCircle className="h-6 w-6 text-white" />
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

export default LiveSession;