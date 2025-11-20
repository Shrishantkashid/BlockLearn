# BlockLearn Video Calling Integration

This project integrates the React-webRTC video calling functionality into the BlockLearn interview system.

## How it works

The integration uses a simplified WebRTC signaling mechanism:
1. Admin and Mentor both connect to a signaling server running on port 8000
2. They join the same room using an interview code
3. Peer-to-peer video connection is established directly between participants

## Setup Instructions

1. Make sure you have Node.js installed
2. Install dependencies for both the main backend and the React-webRTC server:

```bash
# Install main backend dependencies
cd backend
npm install

# Install React-webRTC server dependencies
cd ../React-webRTC/server
npm install
```

## Starting the Servers

You need to run two servers:

1. Main BlockLearn backend (runs on port 5000):
```bash
# From the project root
cd backend
npm start
```

2. React-webRTC signaling server (runs on port 8000):
```bash
# From the project root
cd React-webRTC/server
npm start
```

Or use the provided scripts:
- Windows: `start-react-webrtc.bat`
- Linux/Mac: `start-react-webrtc.sh`

## Using the Video Call Feature

1. Admin navigates to `/admin/interview/:code`
2. Mentor navigates to `/mentor/interview/:code`
3. Both users will automatically join the same room and establish a video connection

## Features

- Video calling between Admin and Mentor
- Mute/unmute audio
- Enable/disable video
- End call
- Basic chat functionality (local only)

## Technical Details

The integration uses:
- Socket.IO for signaling
- WebRTC for peer-to-peer video streaming
- React for the frontend components