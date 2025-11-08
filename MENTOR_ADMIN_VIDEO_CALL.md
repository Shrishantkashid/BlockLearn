# Mentor-Admin Video Call Feature

## Overview
This document explains how to use the new mentor-admin video call feature that allows mentors and administrators to join a meeting room and exchange audio/video streams.

## Features
- Real-time video and audio communication between mentor and admin
- Multi-participant support with clear role labeling
- Chat functionality during the call
- Mute/unmute camera and microphone controls
- Session code-based room joining

## How to Use

### 1. Accessing the Feature
Navigate to `/mentor-admin-landing` to access the landing page for creating or joining a video call session.

### 2. Creating a Session
1. Enter a room ID (or generate a random one)
2. Select your role (Mentor or Admin)
3. Click "Join Video Call"
4. Share the room ID with the other participant

### 3. Joining a Session
1. Enter the shared room ID
2. Select the appropriate role
3. Click "Join Video Call"

### 4. During the Call
- Use the microphone button to mute/unmute audio
- Use the camera button to enable/disable video
- Use the chat button to open the chat sidebar
- Click "End Call" to terminate the session

## Technical Implementation

### Frontend Components
- `MentorAdminCallLanding.jsx` - Landing page for creating/joining sessions
- `MentorAdminVideoCall.jsx` - Main video call interface
- `VideoCall.jsx` - Shared video call component with multi-participant support

### Backend
- Uses the existing Socket.IO signaling server in `signaling.js`
- WebRTC peer-to-peer connections with STUN servers for NAT traversal

### Routes
- `/mentor-admin-landing` - Landing page
- `/mentor-admin-call` - Video call interface

## Testing
To test the feature:
1. Open two browser windows/tabs
2. Navigate to `/mentor-admin-landing` in both
3. In one window, create a room and select "Mentor" role
4. In the other window, join the same room and select "Admin" role
5. Allow camera/microphone permissions when prompted
6. Verify that both participants can see each other's video and hear audio

## Troubleshooting
- If video/audio is not working, check browser permissions
- If participants can't connect, ensure both are using the same room code
- For connection issues, try refreshing the page
- Ensure both participants are using compatible browsers (Chrome, Firefox, Edge)

## Security
- All communication is peer-to-peer via WebRTC
- Signaling (room joining, offer/answer exchange) goes through the Socket.IO server
- No video/audio data is stored on the server
- Session codes are not persisted and are only valid during the active session