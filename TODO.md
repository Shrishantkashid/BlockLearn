# Mentor-Admin Video Call Fix

## Tasks

- [x] Modify VideoCall.jsx to detect mentor-admin calls and use simplified 1-on-1 WebRTC logic
- [x] For 1-on-1 calls: broadcast offers, answers, and ICE candidates to the room instead of targeting specific users
- [x] Remove complex offer tracking and member management logic for mentor-admin calls
- [x] Ensure proper offer/answer exchange by broadcasting to the room for 1-on-1 connections
- [x] Implement broadcasting logic for offers, answers, and ICE candidates in mentor-admin calls
- [x] Update user-joined handler to create offers immediately for mentor-admin calls with shorter delay
- [x] Update backend signaling.js to handle room-based broadcasting for mentor-admin calls
