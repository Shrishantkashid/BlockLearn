# Jitsi Integration Testing Guide

## Overview

This guide explains how to test the Jitsi video conferencing implementation to ensure it meets all product specification requirements.

## Prerequisites

1. Backend server running on port 5000
2. Frontend server running on port 5177
3. MongoDB database connected
4. Email configuration set up (for interview scheduling)

## Test Cases

### Test Case 1: Admin-Mentor Interview Flow

#### Step 1: Schedule an Interview

1. Log in to the admin dashboard
2. Navigate to mentor management
3. Select a mentor and schedule an interview
4. Verify:
   - Unique interview code is generated (8 characters)
   - Unique jitsiRoomName is generated (UUID format)
   - Email is sent to mentor with interview details

#### Step 2: Validate Interview Code

1. Open a new browser/incognito window
2. Navigate to `http://localhost:5177/interview/code-entry`
3. Enter the interview code from Step 1
4. Verify:
   - Validation is successful
   - Redirects to `/video-call/{jitsiRoomName}`
   - Jitsi meeting room loads correctly

#### Step 3: Join Meeting

1. As admin, also navigate to the same meeting URL
2. Verify:
   - Both participants can see each other
   - Audio/video functionality works
   - Simplified interface is displayed
   - Chat functionality works
   - Participant list updates correctly

### Test Case 2: Mentor-Student Session Flow

#### Step 1: Schedule a Session

1. Log in as a mentor
2. Navigate to session booking
3. Schedule a session with a student
4. Verify:
   - Unique session code is generated
   - Unique jitsiRoomName is generated
   - Both mentor and student receive session details

#### Step 2: Join Session

1. At scheduled time, both participants navigate to their session
2. Verify:
   - Redirect to `/video-call/{jitsiRoomName}`
   - Jitsi meeting room loads with simplified interface
   - Both participants can communicate

### Test Case 3: Jitsi Component Features

#### Interface Verification

1. Join any Jitsi meeting
2. Verify simplified toolbar:
   - Microphone control
   - Camera control
   - Chat
   - Settings
   - Raise hand
   - Fullscreen
   - Hangup
3. Verify mobile app promotions are hidden

#### Configuration Verification

1. Check browser console for Jitsi initialization
2. Verify configOverwrite settings:
   - prejoinPageEnabled: true
   - disableModeratorIndicator: true
   - disableDeepLinking: true
3. Verify interfaceConfigOverwrite settings:
   - APP_NAME: 'BlockLearn'
   - MOBILE_APP_PROMO: false
   - SHOW_JITSI_WATERMARK: false

### Test Case 4: Error Handling

#### Invalid Code Test

1. Navigate to `http://localhost:5177/interview/code-entry`
2. Enter an invalid code
3. Verify:
   - Appropriate error message is displayed
   - User is not redirected

#### Expired Session Test

1. Schedule an interview for a past date
2. Try to join with the code
3. Verify:
   - Appropriate error message is displayed
   - User is not redirected

#### Network Issues Test

1. Join a meeting
2. Disconnect internet
3. Verify:
   - Jitsi handles disconnection gracefully
   - Reconnection works when network is restored

## Testing URLs

1. **Interview Code Entry**: `http://localhost:5177/interview/code-entry`
2. **Dynamic Video Call**: `http://localhost:5177/video-call/{jitsiRoomName}`
3. **Jitsi Test Page**: `http://localhost:5177/jitsi-test` (for development testing)

## Verification Points

### Backend Verification

- Check MongoDB collection `interview_sessions` for:
  - `interview_code` field (8-character code)
  - `jitsi_room_name` field (UUID)
  - `meeting_link` field (https://meet.jit.si/{jitsiRoomName})

### Frontend Verification

- Check browser Network tab for:
  - API call to `/validate-interview-code/{code}`
  - Response contains `jitsiRoomName`
  - Redirect to `/video-call/{jitsiRoomName}`

### Jitsi Verification

- Check Jitsi iframe for:
  - Correct room name
  - Simplified toolbar
  - No mobile app promotions
  - Custom app name ("BlockLearn")

## Success Criteria

All tests should pass with:

- ✅ No errors in browser console
- ✅ No errors in backend logs
- ✅ Correct data flow between components
- ✅ Proper error handling
- ✅ Simplified user interface
- ✅ Secure, non-guessable room names

## Troubleshooting

### Common Issues

1. **Jitsi not loading**:

   - Check internet connection
   - Verify Jitsi external API script loads
   - Check browser console for errors

2. **Redirect not working**:

   - Verify API response contains jitsiRoomName
   - Check route configuration in App.jsx
   - Ensure ProtectedRoute is working

3. **Interface not simplified**:
   - Verify configOverwrite settings
   - Check interfaceConfigOverwrite settings
   - Clear browser cache and reload

### Logs to Check

1. **Backend logs**:

   - Interview scheduling messages
   - Code validation requests
   - Database operations

2. **Frontend logs**:

   - Jitsi initialization
   - Component mounting/unmounting
   - API call responses

3. **Browser console**:
   - JavaScript errors
   - Network request failures
   - Jitsi API events

## Completion Checklist

Before considering the implementation complete, verify:

- [ ] Admin-mentor interview flow works end-to-end
- [ ] Mentor-student session flow works end-to-end
- [ ] All functional requirements (FR-01 to FR-05) are met
- [ ] Jitsi interface is properly simplified
- [ ] Error handling works correctly
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Documentation is complete and accurate
