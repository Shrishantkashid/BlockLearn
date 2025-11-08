import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";

function StreamDebug() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const [logs, setLogs] = useState([]);
  const [roomId, setRoomId] = useState("stream-debug");
  const [isConnected, setIsConnected] = useState(false);
  const [localStreamInfo, setLocalStreamInfo] = useState(null);
  const [remoteStreamInfo, setRemoteStreamInfo] = useState(null);

  // WebRTC configuration
  const configuration = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      }
    ]
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        addLog(`Stopped track: ${track.kind}`);
      });
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      addLog("Closed peer connection");
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      addLog("Disconnected socket");
    }
  };

  const initializeSocket = () => {
    addLog("Initializing socket connection...");
    
    const backendUrl = import.meta.env.VITE_API_URL || 
                      (window.location.hostname.includes('vercel.app') 
                        ? `https://${window.location.hostname}` 
                        : 'http://localhost:5000');
    
    socketRef.current = io(backendUrl, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
      path: '/socket.io'
    });

    socketRef.current.on('connect', () => {
      addLog(`Connected to signaling server with ID: ${socketRef.current.id}`);
      setIsConnected(true);
      socketRef.current.emit('join-room', roomId);
      addLog(`Joined room: ${roomId}`);
    });

    socketRef.current.on('connect_error', (error) => {
      addLog(`Socket connection error: ${error.message}`);
      setIsConnected(false);
    });

    // Handle offer
    socketRef.current.on('offer', async (data) => {
      addLog(`Received offer from: ${data.sender}`);
      try {
        // Make sure we have media and peer connection ready
        if (!localStreamRef.current) {
          await initializeMedia();
        }
        
        if (!peerConnectionRef.current) {
          createPeerConnection(localStreamRef.current);
        }
        
        // Wait a bit to ensure peer connection is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        addLog("Setting remote description for offer");
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        addLog("Set remote description for offer");
        
        const answer = await peerConnectionRef.current.createAnswer();
        addLog("Created answer");
        
        await peerConnectionRef.current.setLocalDescription(answer);
        addLog("Set local description for answer");
        
        if (socketRef.current) {
          socketRef.current.emit('answer', {
            target: data.sender,
            answer: answer
          });
          addLog(`Sent answer to: ${data.sender}`);
        }
      } catch (error) {
        addLog(`Error handling offer: ${error.message}`);
      }
    });

    // Handle answer
    socketRef.current.on('answer', async (data) => {
      addLog(`Received answer from: ${data.sender}`);
      if (peerConnectionRef.current && data.answer) {
        try {
          // Check if we're in the right state to set remote description
          if (peerConnectionRef.current.signalingState !== 'have-local-offer') {
            addLog(`Not in correct signaling state: ${peerConnectionRef.current.signalingState}`);
            return;
          }
          
          addLog("Setting remote description for answer");
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          addLog("Set remote description for answer");
        } catch (error) {
          addLog(`Error setting remote description: ${error.message}`);
        }
      }
    });

    // Handle ICE candidate
    socketRef.current.on('ice-candidate', async (data) => {
      addLog(`Received ICE candidate from: ${data.sender}`);
      if (peerConnectionRef.current && data.candidate) {
        try {
          // Check if remote description is set before adding ICE candidate
          if (!peerConnectionRef.current.remoteDescription || !peerConnectionRef.current.remoteDescription.type) {
            addLog("Remote description not set yet, queuing ICE candidate");
            // Queue the ICE candidate to be added later
            if (!peerConnectionRef.current.pendingIceCandidates) {
              peerConnectionRef.current.pendingIceCandidates = [];
            }
            peerConnectionRef.current.pendingIceCandidates.push(data.candidate);
            return;
          }
          
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          addLog("Added ICE candidate");
        } catch (error) {
          addLog(`Error adding ICE candidate: ${error.message}`);
        }
      }
    });

    // Handle user joined
    socketRef.current.on('user-joined', (userId) => {
      addLog(`User joined: ${userId}`);
      // Create an offer for the new user with proper timing
      setTimeout(() => {
        createOffer(userId);
      }, 1500); // Increased delay to ensure peer connection is ready
    });
  };

  const initializeMedia = async () => {
    try {
      addLog("Requesting media devices...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true
      });
      
      localStreamRef.current = stream;
      setLocalStreamInfo({
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().map(track => ({
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState
        }))
      });
      
      addLog(`Acquired local stream: ${stream.id}`);
      addLog(`Stream active: ${stream.active}`);
      addLog(`Stream tracks: ${stream.getTracks().length}`);
      
      stream.getTracks().forEach(track => {
        addLog(`Track - Kind: ${track.kind}, Enabled: ${track.enabled}, Ready: ${track.readyState}`);
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        addLog("Set local video srcObject");
      }
      
      return stream;
    } catch (error) {
      addLog(`Error accessing media devices: ${error.message}`);
      return null;
    }
  };

  const createPeerConnection = (stream) => {
    addLog("Creating peer connection...");
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Add local stream to peer connection
    if (stream) {
      stream.getTracks().forEach(track => {
        addLog(`Adding track to peer connection: ${track.kind}`);
        peerConnectionRef.current.addTrack(track, stream);
      });
    }
    
    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      addLog(`Received remote track: ${event.track.kind}`);
      addLog(`Received remote stream ID: ${event.streams[0].id}`);
      
      setRemoteStreamInfo({
        id: event.streams[0].id,
        active: event.streams[0].active,
        tracks: event.streams[0].getTracks().map(track => ({
          id: track.id,
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState
        }))
      });
      
      // Set the remote stream
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        addLog("Set remote video srcObject");
      }
    };
    
    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        addLog("Generated ICE candidate");
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate
        });
      }
    };
    
    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      addLog(`Connection state: ${peerConnectionRef.current.connectionState}`);
    };
    
    // Handle ICE connection state changes
    peerConnectionRef.current.oniceconnectionstatechange = () => {
      addLog(`ICE connection state: ${peerConnectionRef.current.iceConnectionState}`);
    };
    
    // Handle signaling state changes
    peerConnectionRef.current.onsignalingstatechange = () => {
      addLog(`Signaling state: ${peerConnectionRef.current.signalingState}`);
      // When signaling state becomes stable, add any queued ICE candidates
      if (peerConnectionRef.current.signalingState === 'stable' && 
          peerConnectionRef.current.pendingIceCandidates) {
        peerConnectionRef.current.pendingIceCandidates.forEach(async (candidate) => {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            addLog("Added queued ICE candidate");
          } catch (error) {
            addLog(`Error adding queued ICE candidate: ${error.message}`);
          }
        });
        delete peerConnectionRef.current.pendingIceCandidates;
      }
    };
  };

  const createOffer = async (targetUserId) => {
    try {
      addLog(`Creating offer for: ${targetUserId}`);
      
      // Initialize media if not already done
      if (!localStreamRef.current) {
        addLog("Initializing media for offer creation");
        await initializeMedia();
        // Wait a bit for media to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Ensure peer connection exists
      if (!peerConnectionRef.current) {
        addLog("Creating peer connection for offer creation");
        createPeerConnection(localStreamRef.current);
        // Wait a bit for peer connection to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check if we're in the right state to create an offer
      if (peerConnectionRef.current.signalingState !== 'stable') {
        addLog(`Not in correct signaling state: ${peerConnectionRef.current.signalingState}`);
        // Wait and try again
        await new Promise(resolve => setTimeout(resolve, 500));
        if (peerConnectionRef.current.signalingState !== 'stable') {
          addLog("Still not in correct signaling state, skipping offer creation");
          return;
        }
      }
      
      addLog("Creating offer");
      const offer = await peerConnectionRef.current.createOffer();
      addLog("Setting local description for offer");
      await peerConnectionRef.current.setLocalDescription(offer);
      addLog("Set local description for offer");
      
      if (socketRef.current) {
        socketRef.current.emit('offer', {
          target: targetUserId,
          sender: socketRef.current.id,
          offer: offer
        });
        addLog(`Sent offer to: ${targetUserId}`);
      }
    } catch (error) {
      addLog(`Error creating offer: ${error.message}`);
    }
  };

  const startDebug = async () => {
    setLogs([]);
    setLocalStreamInfo(null);
    setRemoteStreamInfo(null);
    addLog("Starting stream debug...");
    initializeSocket();
  };

  const stopDebug = () => {
    addLog("Stopping debug...");
    cleanup();
    setIsConnected(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Stream Debug</h1>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isConnected}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Connection Status
              </label>
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-white">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            {!isConnected ? (
              <button
                onClick={startDebug}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Start Debug
              </button>
            ) : (
              <button
                onClick={stopDebug}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Stop Debug
              </button>
            )}
            
            <button
              onClick={clearLogs}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Local Video */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Local Stream</h2>
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Local
              </div>
            </div>
            
            {localStreamInfo && (
              <div className="mt-2 text-xs text-gray-300">
                <p>ID: {localStreamInfo.id}</p>
                <p>Active: {localStreamInfo.active ? 'Yes' : 'No'}</p>
                <p>Tracks: {localStreamInfo.tracks.length}</p>
                {localStreamInfo.tracks.map((track, index) => (
                  <div key={index} className="ml-2">
                    <p>Track {index + 1}: {track.kind} - {track.enabled ? 'Enabled' : 'Disabled'} ({track.readyState})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Remote Video */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Remote Stream</h2>
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Remote
              </div>
            </div>
            
            {remoteStreamInfo && (
              <div className="mt-2 text-xs text-gray-300">
                <p>ID: {remoteStreamInfo.id}</p>
                <p>Active: {remoteStreamInfo.active ? 'Yes' : 'No'}</p>
                <p>Tracks: {remoteStreamInfo.tracks.length}</p>
                {remoteStreamInfo.tracks.map((track, index) => (
                  <div key={index} className="ml-2">
                    <p>Track {index + 1}: {track.kind} - {track.enabled ? 'Enabled' : 'Disabled'} ({track.readyState})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Debug Logs</h2>
          
          <div className="mb-4 h-64 overflow-y-auto bg-gray-900 rounded-lg p-4 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 h-full flex items-center justify-center">
                No logs yet. Click "Start Debug" to begin.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-gray-300 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>Open this page in multiple browser tabs/windows with the same Room ID to debug video streams</p>
          <p className="mt-2">Check the logs and stream information to identify issues with black video feeds</p>
        </div>
      </div>
    </div>
  );
}

export default StreamDebug;