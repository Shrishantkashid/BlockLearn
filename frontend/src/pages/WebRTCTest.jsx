import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function WebRTCTest() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Not connected");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  // STUN servers configuration
  const configuration = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ]
      }
    ]
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setConnectionStatus("Failed to access camera/microphone");
      return null;
    }
  };

  const createPeerConnection = (stream) => {
    if (peerConnectionRef.current) {
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
      }
      setIsConnected(true);
      setConnectionStatus("Connected to remote peer");
    };
    
    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          roomId: roomId,
          candidate: event.candidate
        });
      }
    };
    
    return peerConnectionRef.current;
  };

  const joinRoom = async () => {
    if (!roomId.trim()) {
      setConnectionStatus("Please enter a room ID");
      return;
    }

    setConnectionStatus("Initializing media devices...");
    
    // Initialize media
    const stream = await initializeMedia();
    if (!stream) return;
    
    setConnectionStatus("Connecting to signaling server...");
    
    // Initialize socket connection
    const io = (await import('socket.io-client')).default;
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      console.log('Connected to signaling server');
      setConnectionStatus("Connected to signaling server");
      socketRef.current.emit('join-room', roomId);
    });
    
    // Handle offer from another peer
    socketRef.current.on('offer', async (data) => {
      console.log('Received offer:', data);
      setConnectionStatus("Received offer from peer");
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        
        socketRef.current.emit('answer', {
          roomId: roomId,
          answer: answer
        });
        
        setConnectionStatus("Sent answer to peer");
      }
    });
    
    // Handle answer from another peer
    socketRef.current.on('answer', async (data) => {
      console.log('Received answer:', data);
      setConnectionStatus("Received answer from peer");
      
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setIsConnected(true);
        setConnectionStatus("Connected to remote peer");
      }
    });
    
    // Handle ICE candidate
    socketRef.current.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate:', data);
      setConnectionStatus("Received ICE candidate");
      
      if (peerConnectionRef.current && data.candidate) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });
    
    // Handle user joined
    socketRef.current.on('user-joined', async (userId) => {
      console.log('User joined:', userId);
      setConnectionStatus("User joined, creating offer");
      
      // Create peer connection
      const pc = createPeerConnection(stream);
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socketRef.current.emit('offer', {
        roomId: roomId,
        offer: offer
      });
      
      setConnectionStatus("Sent offer to peer");
    });
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
      socketRef.current.disconnect();
    }
    setIsConnected(false);
    setConnectionStatus("Call ended");
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">WebRTC Connection Test</h1>
          <p className="text-gray-400 mb-6">Test peer-to-peer video connection between mentor and admin</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                />
                <button
                  onClick={joinRoom}
                  disabled={!roomId.trim() || isConnected}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Connection Status
              </label>
              <div className={`px-3 py-2 rounded-md ${
                isConnected ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-300'
              }`}>
                {connectionStatus}
              </div>
            </div>
          </div>
          
          <button
            onClick={endCall}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-md transition-colors"
          >
            End Call
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Local Video */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">Local Video</h2>
            <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-2 text-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Your Camera
              </span>
            </div>
          </div>
          
          {/* Remote Video */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-medium text-white mb-4">Remote Video</h2>
            <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-700 mb-4">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Waiting for remote video...</p>
                </div>
              )}
            </div>
            <div className="mt-2 text-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}