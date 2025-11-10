import React, { useState, useEffect, useRef } from "react";
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
  Users,
  CheckCircle,
  AlertCircle,
  Send,
  MessageCircle
} from "lucide-react";
import { 
  isWebRTCSupported, 
  getMediaConstraints, 
  createPeerConnection, 
  addStreamToPeerConnection,
  handleWebRTCError,
  closeConnection
} from "../utils/webrtcUtils";

export default function VideoCall({ 
  code, 
  userType, 
  onEndCall, 
  showSidebar = true,
  showInterviewDetails = true 
}) {
  const navigate = onEndCall;
  
  // Check if this is a mentor-student session (not an interview)
  const isMentorStudentSession = !showInterviewDetails;

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const isInitializingRef = useRef(false);
  const messagesEndRef = useRef(null);
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
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

  // Add a ref to track if the component has been mounted
  const isComponentMountedRef = useRef(false);
  // Add a ref to track if we've already created an offer for a user
  const offerCreatedRef = useRef(new Set());

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
      console.log('Cleaning up VideoCall component');
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
        setLocalStream(null);
      }
      isInitializingRef.current = false;
    };
  }, []);

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
      setError('Connection to server lost. Please refresh the page.');
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
    // Determine the backend URL based on environment
    const backendUrl = import.meta.env.VITE_API_URL || 
                      (window.location.hostname.includes('vercel.app') 
                        ? `https://${window.location.hostname}` 
                        : 'http://localhost:5000');
    
    console.log('Connecting to signaling server at:', backendUrl);
    
    // Connect to the signaling server with improved configuration
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

    // Handle offer from another peer
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
              target: data.sender,
              answer: answer
            });
            console.log('Answer sent to:', data.sender);
          }
        }
      } catch (error) {
        handleWebRTCError(error, 'handling offer');
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
          showNotificationPopup(`${userType === 'admin' ? 'Mentor' : 'Admin'} joined the interview session`);
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

    // Handle user joined
    socketRef.current.on('user-joined', (userId) => {
      console.log('User joined:', userId);
      setMembers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
      
      const role = userId === socketRef.current.id ? userType : (userType === 'admin' ? 'Mentor' : 'Admin');
      showNotificationPopup(`${role} joined the room`);
      
      // Update connection status if we have remote streams
      if (Object.keys(remoteStreams).length > 0) {
        setIsConnected(true);
      }
      
      if (localStream && peerConnectionRef.current) {
        console.log('Local stream and peer connection ready, creating offer for user:', userId);
        if (!offerCreatedRef.current.has(userId)) {
          offerCreatedRef.current.add(userId);
          console.log('Creating offer for user:', userId);
          setTimeout(() => {
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
        setTimeout(() => {
          if (isComponentMountedRef.current && localStream && peerConnectionRef.current) {
            console.log('Retrying to create offer for user:', userId);
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
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[userId];
        return newStreams;
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      showNotificationPopup(`${userType === 'admin' ? 'Mentor' : 'Admin'} left the room`);
      setOtherParticipant(prev => ({ ...prev, hasVideo: false }));
      setMembers(prev => prev.filter(member => member !== userId));
      console.log('User left, isConnected set to false');
    });
    
    // Handle chat messages
    socketRef.current.on('message', (data) => {
      console.log('Received message:', data);
      if (data && data.message) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: data.message.text || '',
          sender: data.sender || data.message.sender || '', // Handle both data formats
          timestamp: data.message.timestamp || new Date().toLocaleTimeString(),
          isOwn: (data.sender || data.message.sender) === socketRef.current.id
        }]);
      }
    });
  };

  const initializeMedia = async () => {
    if (!isComponentMountedRef.current) {
      console.log('Component unmounted, skipping media initialization');
      return;
    }
    
    console.log('initializeMedia called, localStream:', !!localStream, 'isInitializingRef:', isInitializingRef.current);
    
    if (localStream) {
      console.log('Local stream already initialized');
      return;
    }
    
    if (isInitializingRef.current) {
      console.log('Media initialization already in progress');
      return;
    }
    
    isInitializingRef.current = true;
    
    try {
      console.log('Initializing media devices...');
      const constraints = getMediaConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!isComponentMountedRef.current) {
        console.log('Component unmounted during async operation, stopping stream tracks');
        stream.getTracks().forEach(track => track.stop());
        isInitializingRef.current = false;
        return;
      }
      
      console.log('Media stream acquired, checking if localStream already set:', !!localStream);
      
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
        localVideoRef.current.play().catch(error => {
          console.log('Auto-play prevented for local video:', error);
        });
      }
      
      console.log('Creating peer connection...');
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      addStreamToPeerConnection(pc, stream);
      
      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote stream from:', event.streams[0].id);
        const remoteUserId = event.streams[0].id;
        setRemoteStreams(prev => ({
          ...prev,
          [remoteUserId]: event.streams[0]
        }));
        
        // Set the first remote stream as the main one for display
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(error => {
            console.log('Auto-play prevented:', error);
          });
        }
        
        // Update connection status
        setIsConnected(true);
        setCallAccepted(true); // Automatically accept call when we receive a stream
        console.log('Connection established, isConnected set to true');
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          // Send to the user who sent us the offer/answer
          const targetUser = caller || members[0]; // Use caller if set, otherwise first member
          if (targetUser) {
            console.log('Sending ICE candidate to:', targetUser);
            socketRef.current.emit('ice-candidate', {
              target: targetUser,
              candidate: event.candidate
            });
          }
        }
      };
      
      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          console.log('Connection established via state change, isConnected set to true');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
          console.log('Connection lost via state change, isConnected set to false');
        }
      };
      
      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          setIsConnected(false);
          console.log('ICE connection lost, isConnected set to false');
        } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setIsConnected(true);
          console.log('ICE connection established, isConnected set to true');
        }
      };
      
      // If there are already users in the room, initiate calls
      if (members.length > 0) {
        members.forEach(userId => {
          console.log('Creating offer for existing user:', userId);
          if (!offerCreatedRef.current.has(userId)) {
            offerCreatedRef.current.add(userId);
            console.log('Creating offer for user:', userId);
            setTimeout(() => {
              if (isComponentMountedRef.current) {
                createOffer(userId);
              }
            }, 1500);
          } else {
            console.log('Offer already created for user:', userId);
          }
        });
      }
      
    } catch (error) {
      if (isComponentMountedRef.current) {
        handleWebRTCError(error, 'initializing media');
        setError(`Failed to access camera/microphone: ${error.message}. Please check permissions.`);
      }
      isInitializingRef.current = false;
    } finally {
      if (isComponentMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const createOffer = async (targetUserId) => {
    if (!isComponentMountedRef.current) {
      console.log('Component unmounted, skipping offer creation');
      return;
    }
    
    if (!peerConnectionRef.current) {
      console.log('Peer connection not ready yet');
      return;
    }
    
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
      if (isComponentMountedRef.current) {
        handleWebRTCError(error, 'creating offer');
      }
    }
  };

  const createAnswer = async () => {
    console.log('createAnswer function called (should not be needed with new flow)');
  };

  const toggleMute = async () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      
      if (!isMuted) {
        audioTracks.forEach(track => {
          track.enabled = false;
        });
        setIsMuted(true);
      } else {
        audioTracks.forEach(track => {
          track.enabled = true;
        });
        setIsMuted(false);
      }
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
    closeConnection(peerConnectionRef.current, localStream);
    
    if (socketRef.current) {
      socketRef.current.emit('leave-room', code);
      socketRef.current.disconnect();
    }
    if (onEndCall) {
      onEndCall();
    }
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
      
      socketRef.current.emit('message', { roomId: code, message: messageData });
      
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
          <p className="text-white text-xl">Connecting to session...</p>
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
              onClick={endCall}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
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
            <h1 className="text-xl font-bold text-white">
              {isMentorStudentSession 
                ? 'Mentor-Student Session' 
                : userType === 'admin' ? 'Admin Interview Session' : 'Interview Session'}
            </h1>
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
        {/* Video Area */}
        <div className={`${showSidebar || showChat ? 'w-3/4' : 'flex-1'} relative`}>
          {/* Remote Video */}
          <div className="h-full bg-black flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {Object.keys(remoteStreams).length > 0 ? (
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
                    <h3 className="text-xl font-bold text-white mb-2">
                      {isMentorStudentSession 
                        ? (userType === 'mentor' ? 'Student' : 'Mentor')
                        : (userType === 'admin' ? 'Mentor' : 'Admin')}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {isConnected 
                        ? 'Video feed will appear here' 
                        : isMentorStudentSession
                          ? `Waiting for ${userType === 'mentor' ? 'student' : 'mentor'} to join...`
                          : `Waiting for ${userType === 'admin' ? 'mentor' : 'admin'} to join...`}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Local Video (Picture-in-Picture) */}
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
                    You ({isMentorStudentSession 
                      ? (userType === 'mentor' ? 'Mentor' : 'Student')
                      : (userType === 'admin' ? 'Admin' : 'Mentor')})
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

        {/* Sidebar */}
        {showSidebar && !showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Member List */}
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-lg mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Participants ({members.length + 1})
              </h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 bg-gray-700 rounded">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">
                    You ({isMentorStudentSession 
                      ? (userType === 'mentor' ? 'Mentor' : 'Student')
                      : userType})
                  </span>
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                {members.map((memberId, index) => (
                  <div key={memberId} className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm">
                      {isMentorStudentSession 
                        ? (userType === 'mentor' ? 'Student' : 'Mentor')
                        : (userType === 'admin' ? 'Mentor' : 'Admin')} {index + 1}
                    </span>
                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Interview Details */}
            {showInterviewDetails && (
              <div className="p-4 border-b border-gray-700">
                <h2 className="font-semibold text-lg mb-3">Session Details</h2>
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
                )}

              </div>
            )}
            
            {/* Chat Toggle */}
            <div className="p-4 border-t border-gray-700 mt-auto">
              <button
                onClick={() => setShowChat(true)}
                className="w-full flex items-center justify-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Open Chat
              </button>
            </div>
          </div>
        )}
        
        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-full px-4 py-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full ${
                isMuted ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
              } transition-colors`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full ${
                isVideoOff ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"
              } transition-colors`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            
            <button
              onClick={endCall}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              title="End call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
