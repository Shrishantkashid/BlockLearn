# Jitsi Video Conferencing Integration

This document explains how the Jitsi video conferencing feature has been implemented in the BlockLearn platform.

## Overview

We've replaced the previous WebRTC implementation with Jitsi Meet, which provides a more reliable and feature-rich video conferencing solution. The integration supports two primary use cases:

1. Scheduled interview calls between admin and mentor
2. Video calls between mentor and student following pre-arranged schedules

## Implementation Details

### Backend Changes

1. **Interview Scheduling**: The `/api/admin/schedule-interview/:mentorId` endpoint now generates Jitsi meeting links instead of WebRTC meeting links.

   - Meeting links are generated in the format: `https://meet.jit.si/{interviewCode}`
   - The unique 8-character interview code is used as the Jitsi room name

2. **Email Notifications**: Interview confirmation emails now contain direct links to Jitsi meetings.

### Frontend Components

1. **JitsiMeetComponent**: A new React component that wraps the Jitsi Meet External API

   - Dynamically loads the Jitsi script from `https://meet.jit.si/external_api.js`
   - Configures the meeting room with appropriate settings
   - Handles meeting events (join, leave, etc.)

2. **VideoCall Component**: Updated to use Jitsi instead of WebRTC

   - Maintains the same UI/UX but integrates with Jitsi
   - Preserves chat functionality and participant lists

3. **InterviewCodeEntry Page**: Updated to redirect users directly to Jitsi meetings

### Jitsi Configuration

The integration uses the following configuration:

- **Domain**: meet.jit.si (Jitsi's public instance)
- **Room Names**: 8-character unique codes generated for each interview
- **User Display Names**: Based on user type (Admin, Mentor, Student)
- **Interface Customization**:
  - Simplified toolbar with essential controls
  - Branding customization to match BlockLearn
  - Prejoin page enabled for better user experience

## Testing

A test page has been added at `/jitsi-test` to verify the integration works correctly.

## Usage Instructions

### For Admin-Mentor Interviews

1. Admin schedules an interview through the admin dashboard
2. Mentor receives an email with the interview details and Jitsi meeting link
3. At the scheduled time, both participants navigate to `/interview/code-entry`
4. Enter the provided interview code
5. You will be redirected to the Jitsi meeting room

### For Mentor-Student Sessions

1. Mentor and student schedule a session through the booking system
2. Both participants receive session details with Jitsi meeting link
3. At the scheduled time, participants join the meeting through the session interface
4. The session uses the same Jitsi integration with appropriate room naming

## Features

- Video and audio conferencing
- Screen sharing
- Chat functionality
- Recording capabilities
- Mobile support
- No account required for participants
- Secure, encrypted meetings

## Limitations

- Dependent on Jitsi's public infrastructure
- Bandwidth requirements for video quality
- Browser compatibility (modern browsers required)

## Future Enhancements

- Custom Jitsi server deployment for better control
- Advanced moderation features
- Integration with platform's user authentication
- Recording and transcription services
