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
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Send,
  MessageCircle
} from "lucide-react";

export default function AdminInterviewSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const isInitializingRef = useRef(false); // Add this ref
  const messagesEndRef = useRef(null);
  
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
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [otherParticipant, setOtherParticipant] = useState({ name: 'Mentor', hasVideo: false });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  
  // WebRTC configuration
  const configuration = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
    ]
  };

  // Show notification popup
  const showNotificationPopup = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Add a ref to track if the component has been mounted
  const isComponentMountedRef = useRef(false);
  // Add a ref to track if we've already created an offer for a user
  const offerCreatedRef = useRef(new Set());

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
      console.log('Cleaning up AdminInterviewSession component');
      isComponentMountedRef.current = false;
      // Clear the offer created set
      offerCreatedRef.current.clear();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null); // Clear the local stream state
      }
      isInitializingRef.current = false;
    };
  }, []); // Empty dependency array to run only once

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

    const handleReconnectError = (error) => {
      console.error('Socket reconnect error:', error);
    };

    const handleReconnectFailed = () => {
      console.error('Socket reconnect failed');
      setError('Connection to server lost. Please refresh the page.');
    };

    socketRef.current.on('reconnect', handleReconnect);
    socketRef.current.on('reconnect_attempt', handleReconnectAttempt);
    socketRef.current.on('reconnect_error', handleReconnectError);
    socketRef.current.on('reconnect_failed', handleReconnectFailed);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('reconnect', handleReconnect);
        socketRef.current.off('reconnect_attempt', handleReconnectAttempt);
        socketRef.current.off('reconnect_error', handleReconnectError);
        socketRef.current.off('reconnect_failed', handleReconnectFailed);
      }
    };
  }, [code]);

  const initializeSocket = () => {
    // Connect to the signaling server with improved configuration
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'], // Allow polling as fallback
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
      rejectUnauthorized: false // Disable SSL verification for local development
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
          showNotificationPopup('Mentor joined the interview session');
          setOtherParticipant(prev => ({ ...prev, hasVideo: true }));
          console.log('Answer received and processed, isConnected set to true');
          
          // Force play the remote video if it exists
          if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.play().catch(error => {
              console.log('Auto-play prevented for remote video:', error);
            });
          }
        } catch (error) {
          console.error('Error setting remote description:', error);
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
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    // Handle user joined
    socketRef.current.on('user-joined', (userId) => {
      console.log('User joined:', userId);
      console.log('Local stream available:', !!localStream);
      console.log('Current caller state:', caller);
      console.log('Peer connection status:', !!peerConnectionRef.current);
    
      // Store the userId of the other user for later use
      setCaller(prev => {
        // Only update if we don't already have a caller or if it's a different user
        if (!prev || prev.sender !== userId) {
          const newCaller = { sender: userId };
          console.log('Setting caller to new user:', newCaller);
          return newCaller;
        }
        console.log('Caller already set to same user, not updating:', prev);
        return prev;
      });
    
      // Show notification when mentor joins
      showNotificationPopup('Mentor joined the room');
      setOtherParticipant(prev => ({ ...prev, hasVideo: false }));
    
      // If we have a local stream and peer connection, we can initiate a call immediately
      if (localStream && peerConnectionRef.current) {
        console.log('Local stream and peer connection ready, creating offer for user:', userId);
        // Check if we've already created an offer for this user
        if (!offerCreatedRef.current.has(userId)) {
          offerCreatedRef.current.add(userId);
          console.log('Creating offer for user:', userId);
          // Add a small delay to ensure everything is ready
          setTimeout(() => {
            // Check if component is still mounted before creating offer
            if (isComponentMountedRef.current) {
              createOffer(userId);
            }
          }, 1500);
        } else {
          console.log('Offer already created for user:', userId);
        }
      } else {
        console.log('Local stream or peer connection not ready yet, will create offer when ready');
        console.log('Local stream status:', !!localStream, 'Peer connection status:', !!peerConnectionRef.current);
        // Retry after a delay if not ready
        setTimeout(() => {
          if (isComponentMountedRef.current && localStream && peerConnectionRef.current && caller && caller.sender === userId) {
            console.log('Retrying to create offer for user:', userId);
            // Check if we've already created an offer for this user
            if (!offerCreatedRef.current.has(userId)) {
              offerCreatedRef.current.add(userId);
              console.log('Creating offer for user:', userId);
              createOffer(userId);
            } else {
              console.log('Offer already created for user:', userId);
            }
          }
        }, 3000);
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
      showNotificationPopup('Mentor left the room');
      setOtherParticipant(prev => ({ ...prev, hasVideo: false }));
      console.log('User left, isConnected set to false');
    });

    // Handle chat messages
    socketRef.current.on('message', (data) => {
      console.log('Received message:', data);
      // Check if data and data.message exist before accessing properties
      if (data && data.message) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: data.message.text || '',
          sender: data.message.sender || '',
          timestamp: data.message.timestamp || new Date().toLocaleTimeString(),
          isOwn: data.message.sender === socketRef.current.id
        }]);
      }
    });
  };

  const initializeMedia = async () => {
    // Check if component is still mounted
    if (!isComponentMountedRef.current) {
      console.log('Component unmounted, skipping media initialization');
      return;
    }
    
    console.log('initializeMedia called, localStream:', !!localStream, 'isInitializingRef:', isInitializingRef.current);
    
    // Prevent multiple initializations
    if (localStream) {
      console.log('Local stream already initialized');
      return;
    }
    
    // Prevent concurrent initializations
    if (isInitializingRef.current) {
      console.log('Media initialization already in progress');
      return;
    }
    
    isInitializingRef.current = true;
    
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
      
      // Check if component is still mounted after async operation
      if (!isComponentMountedRef.current) {
        console.log('Component unmounted during async operation, stopping stream tracks');
        stream.getTracks().forEach(track => track.stop());
        isInitializingRef.current = false;
        return;
      }
      
      console.log('Media stream acquired, checking if localStream already set:', !!localStream);
      
      // Double check if stream was already set during async operation
      if (localStream) {
        console.log('Local stream was set during async operation, stopping new stream tracks');
        stream.getTracks().forEach(track => track.stop());
        isInitializingRef.current = false;
        return;
      }
      
      console.log('Media stream acquired:', stream);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Force video element to play
        localVideoRef.current.play().catch(error => {
          console.log('Auto-play prevented for local video:', error);
        });
      }
      
      // Create peer connection
      console.log('Creating peer connection...');
      createPeerConnection(stream);
      
      // If there's already a user in the room, initiate a call
      if (caller && caller.sender) {
        console.log('Creating offer for existing user:', caller.sender);
        // Check if we've already created an offer for this user
        if (!offerCreatedRef.current.has(caller.sender)) {
          offerCreatedRef.current.add(caller.sender);
          console.log('Creating offer for user:', caller.sender);
          // Add a small delay to ensure everything is ready
          setTimeout(() => {
            // Check if component is still mounted before creating offer
            if (isComponentMountedRef.current) {
              createOffer(caller.sender);
            }
          }, 1500);
        } else {
          console.log('Offer already created for user:', caller.sender);
        }
      }
      
    } catch (error) {
      // Check if component is still mounted before setting error
      if (isComponentMountedRef.current) {
        console.error('Error accessing media devices:', error);
        setError('Failed to access camera/microphone. Please check permissions.');
      }
      isInitializingRef.current = false; // Make sure to reset on error
    } finally {
      // Check if component is still mounted before setting loading state
      if (isComponentMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const createPeerConnection = (stream) => {
    // Validate stream before creating peer connection
    if (!stream || !stream.active) {
      console.error('Invalid or inactive media stream provided to createPeerConnection');
      setError('Failed to initialize media connection. Please try again.');
      return;
    }
    
    // Prevent creating multiple peer connections
    if (peerConnectionRef.current) {
      console.log('Peer connection already exists, closing existing connection');
      peerConnectionRef.current.close();
    }
    
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Add local stream to peer connection
    stream.getTracks().forEach(track => {
      peerConnectionRef.current.addTrack(track, stream);
    });
    
    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0]);
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        // Force video element to play
        remoteVideoRef.current.play().catch(error => {
          console.log('Auto-play prevented:', error);
        });
      }
      setOtherParticipant(prev => ({ ...prev, hasVideo: true }));
      setIsConnected(true); // Set connected status when we receive remote stream
      console.log('Connection established, isConnected set to true');
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
        console.log('Connection established via state change, isConnected set to true');
      } else if (peerConnectionRef.current.connectionState === 'disconnected' || 
                 peerConnectionRef.current.connectionState === 'failed') {
        setIsConnected(false);
        console.log('Connection lost via state change, isConnected set to false');
      }
    };
    
    // Handle ICE connection state changes
    peerConnectionRef.current.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnectionRef.current.iceConnectionState);
      if (peerConnectionRef.current.iceConnectionState === 'disconnected' || 
          peerConnectionRef.current.iceConnectionState === 'failed') {
        setIsConnected(false);
        console.log('ICE connection lost, isConnected set to false');
      } else if (peerConnectionRef.current.iceConnectionState === 'connected' || 
                 peerConnectionRef.current.iceConnectionState === 'completed') {
        setIsConnected(true);
        console.log('ICE connection established, isConnected set to true');
      }
    };
  };

  const createOffer = async (targetUserId) => {
    // Check if component is still mounted
    if (!isComponentMountedRef.current) {
      console.log('Component unmounted, skipping offer creation');
      return;
    }
    
    // Prevent creating multiple offers
    if (!peerConnectionRef.current) {
      console.log('Peer connection not ready yet');
      return;
    }
    
    // Check if we already have a local description (offer/answer)
    if (peerConnectionRef.current.localDescription) {
      console.log('Local description already exists, skipping offer creation');
      return;
    }
    
    try {
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
      // Check if component is still mounted before logging error
      if (isComponentMountedRef.current) {
        console.error('Error creating offer:', error);
      }
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

  const toggleVideo = async () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      
      if (!isVideoOff) {
        // Turn off video
        videoTracks.forEach(track => {
          track.enabled = false;
        });
        setIsVideoOff(true);
      } else {
        // Turn on video
        videoTracks.forEach(track => {
          track.enabled = true;
        });
        setIsVideoOff(false);
      }
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
    navigate('/admin/dashboard');
  };

  const acceptCall = () => {
    createAnswer();
  };

  const rejectCall = () => {
    setIsCalling(false);
    setCaller(null);
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      const messageData = {
        text: newMessage,
        sender: socketRef.current.id,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Send to server
      socketRef.current.emit('message', { roomId: code, message: messageData });
      
      // Add to local messages
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
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
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-gray-800 border-l-4 border-green-500 text-white p-4 rounded shadow-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

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
            <h1 className="text-xl font-bold text-white">Admin Interview Session</h1>
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
        {/* Video Area - Modified for Admin View */}
        <div className={`${showChat ? 'w-3/4' : 'flex-1'} relative`}>
          {/* Show Mentor's video as main view for admin */}
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
                      {!isConnected && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Waiting
                        </div>
                      )}
                      {isConnected && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Mentor</h3>
                    <p className="text-gray-400 mb-4">
                      {isConnected ? 'Video feed will appear here' : 'Waiting for mentor to join...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Show Admin's video as overlay for admin */}
              <div className="absolute bottom-4 right-4 w-1/4 max-w-xs">
                <div className="relative bg-black rounded-lg overflow-hidden border-2 border-gray-700">
                  {localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gray-700 w-full h-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex space-x-2">
                    <div className={`h-3 w-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div className={`h-3 w-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    You (Admin)
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
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
              <div ref={messagesEndRef} />
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