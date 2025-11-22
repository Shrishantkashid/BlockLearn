# Moderated Meetings Implementation

## Issue

The system needed to support moderated Jitsi meetings where admins and mentors would join the same meeting but with different permissions. Admins needed to join through moderated links while mentors used standard links.

## Solution Implemented

### 1. Backend Updates (admin.js)

- Generate separate meeting links for admin and mentor during interview scheduling
- Admin link uses moderated Jitsi: `https://moderated.jitsi.net/{roomName}`
- Mentor link uses standard Jitsi: `https://meet.jit.si/{roomName}`
- Store both links in the interview data structure
- Update validate-interview-code endpoint to return both links

### 2. Email Template

- Updated to include both Admin Meeting Link and Mentor Meeting Link
- Clear instructions for each user type on which link to use
- Both links point to the same Jitsi room but with different permissions

### 3. Frontend Updates (InterviewCodeEntry.jsx)

- Determine user type (admin or mentor) on component mount
- Redirect admins to moderated meeting link
- Redirect mentors to standard meeting link
- Use fetchUserProfile API to get user type information

## How It Works

1. **Admin Schedules Interview**:

   - System generates unique room name using crypto.randomUUID()
   - Creates moderated link for admin: `https://moderated.jitsi.net/{roomName}`
   - Creates standard link for mentor: `https://meet.jit.si/{roomName}`
   - Stores both links in interview data

2. **Email Notification**:

   - Sends email with both meeting links
   - Clear instructions for admin and mentor on which link to use

3. **User Joins Meeting**:
   - User navigates to `/interview/code-entry`
   - System determines user type from their profile
   - Admin enters code → redirected to moderated link
   - Mentor enters code → redirected to standard link

## Benefits

- ✅ Admins get moderated meeting permissions
- ✅ Mentors get standard meeting access
- ✅ Both join the same Jitsi room
- ✅ Proper routing based on user type
- ✅ Clear instructions in email notifications

## Verification

- ✅ Moderated meetings implementation complete
- ✅ Admins get moderated meeting links
- ✅ Mentors get standard meeting links
- ✅ Proper routing based on user type
