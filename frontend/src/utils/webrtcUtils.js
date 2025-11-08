/**
 * WebRTC Utility Functions
 * Helper functions for WebRTC connection management
 */

/**
 * Check if WebRTC is supported in the current browser
 * @returns {boolean} Whether WebRTC is supported
 */
export const isWebRTCSupported = () => {
  return !!(
    (typeof RTCPeerConnection !== 'undefined') &&
    (typeof RTCIceCandidate !== 'undefined') &&
    (typeof RTCSessionDescription !== 'undefined')
  );
};

/**
 * Get detailed information about a media stream
 * @param {MediaStream} stream - The media stream to analyze
 * @returns {Object} Stream information
 */
export const getStreamInfo = (stream) => {
  if (!stream) return null;
  
  const tracks = stream.getTracks();
  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();
  
  return {
    id: stream.id,
    active: stream.active,
    trackCount: tracks.length,
    videoTrackCount: videoTracks.length,
    audioTrackCount: audioTracks.length,
    tracks: tracks.map(track => ({
      id: track.id,
      kind: track.kind,
      label: track.label,
      enabled: track.enabled,
      readyState: track.readyState
    }))
  };
};

/**
 * Get browser-specific WebRTC constraints
 * @returns {Object} Media constraints
 */
export const getMediaConstraints = () => {
  return {
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
  };
};

/**
 * Create a new RTCPeerConnection with standardized configuration
 * @param {Object} config - Additional configuration options
 * @returns {RTCPeerConnection} The created peer connection
 */
export const createPeerConnection = (config = {}) => {
  const defaultConfig = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun.l.google.com:19302',
          'stun:stun.stunprotocol.org:3478'
        ]
      }
    ]
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  return new RTCPeerConnection(finalConfig);
};

/**
 * Add a media stream to a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {MediaStream} stream - The media stream to add
 */
export const addStreamToPeerConnection = (peerConnection, stream) => {
  if (!peerConnection || !stream) return;
  
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });
};

/**
 * Handle errors in a standardized way
 * @param {Error} error - The error to handle
 * @param {string} context - Context where the error occurred
 */
export const handleWebRTCError = (error, context) => {
  console.error(`WebRTC Error in ${context}:`, error);
  
  // Log specific error types
  if (error.name) {
    console.error(`Error name: ${error.name}`);
  }
  
  if (error.message) {
    console.error(`Error message: ${error.message}`);
  }
  
  // Handle specific error types
  switch (error.name) {
    case 'NotAllowedError':
      console.error('User denied permission to access media devices');
      break;
    case 'NotFoundError':
      console.error('No media devices found');
      break;
    case 'NotReadableError':
      console.error('Media device is already in use');
      break;
    case 'OverconstrainedError':
      console.error('Media constraints cannot be satisfied');
      break;
    case 'AbortError':
      console.error('Media operation was aborted');
      break;
    default:
      console.error('Unknown WebRTC error');
  }
};

/**
 * Get connection state information
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @returns {Object} Connection state information
 */
export const getConnectionStateInfo = (peerConnection) => {
  if (!peerConnection) return null;
  
  return {
    connectionState: peerConnection.connectionState,
    iceConnectionState: peerConnection.iceConnectionState,
    iceGatheringState: peerConnection.iceGatheringState,
    signalingState: peerConnection.signalingState
  };
};

/**
 * Close a peer connection and stop all tracks
 * @param {RTCPeerConnection} peerConnection - The peer connection to close
 * @param {MediaStream} localStream - The local media stream to stop
 */
export const closeConnection = (peerConnection, localStream) => {
  if (peerConnection) {
    peerConnection.close();
  }
  
  if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop();
    });
  }
};

export default {
  isWebRTCSupported,
  getStreamInfo,
  getMediaConstraints,
  createPeerConnection,
  addStreamToPeerConnection,
  handleWebRTCError,
  getConnectionStateInfo,
  closeConnection
};