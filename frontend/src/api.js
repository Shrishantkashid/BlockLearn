import axios from 'axios';
import { API_URL } from './config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      // Optionally redirect to pre-login page
      // window.location.href = '/prelogin';
    }
    return Promise.reject(error);
  }
);

// Generic API request
export async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const response = await api.request({
      url: endpoint,
      method,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
}

// Send OTP to email
export async function sendOTP(email, isNewUser = false) {
  const response = await api.post('/api/auth/send-otp', { email, isNewUser });
  return response.data;
}

// Verify OTP and login/register
export async function verifyOTP(email, otp, firstName = null, lastName = null, isNewUser = false) {
  const response = await api.post('/api/auth/verify-otp', {
    email,
    otp,
    firstName,
    lastName,
    isNewUser,
  });
  return response.data;
}

// Get current user profile
export async function fetchUserProfile(token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await api.get('/api/auth/me', { headers });
  return response.data;
}

// Refresh user data from backend
export async function refreshUserData() {
  try {
    const response = await api.get('/api/auth/me');
    if (response.data.success && response.data.user) {
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      return response.data.user;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return null;
  }
}

// Get allowed email domains
export async function getAllowedDomains() {
  const response = await api.get('/api/auth/allowed-domains');
  return response.data;
}

// Validate interview code
export async function validateInterviewCode(code) {
  const response = await api.get(`/api/auth/validate-interview-code/${code}`);
  return response;
}

// Matching API endpoints
export async function getMatchingMentors(skillId) {
  const response = await api.get(`/api/matching/mentors/${skillId}`);
  return response.data;
}

export async function searchMentors(filters) {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await api.get(`/api/matching/mentors-advanced?${queryParams}`);
  return response.data;
}

export async function getMatchDetail(mentorId, skillId) {
  const response = await api.get(`/api/matching/match-detail/${mentorId}/${skillId}`);
  return response.data;
}

export async function getTrainingData() {
  const response = await api.get('/api/matching/training-data');
  return response.data;
}

// Skills API endpoints
export async function getAllSkills() {
  const response = await api.get('/api/skills');
  return response.data;
}

export async function getUserSkills() {
  const response = await api.get('/api/skills/user');
  return response.data;
}

export async function addUserSkill(skillData) {
  const response = await api.post('/api/skills/user', skillData);
  return response.data;
}

export async function removeUserSkill(skillId, skillType) {
  const response = await api.delete(`/api/skills/user/${skillId}/${skillType}`);
  return response.data;
}

// Sessions API endpoints
export async function getUserSessions() {
  const response = await api.get('/api/sessions');
  return response.data;
}

export async function getSessionById(sessionId) {
  const response = await api.get(`/api/sessions/${sessionId}`);
  return response.data;
}

export async function createSession(sessionData) {
  const response = await api.post('/api/sessions', sessionData);
  return response.data;
}

export async function generateLiveSessionCode(sessionId) {
  const response = await api.post('/api/sessions/generate-live-code', { session_id: sessionId });
  return response.data;
}

export async function validateLiveSessionCode(code) {
  const response = await api.get(`/api/sessions/validate-live-code/${code}`);
  return response.data;
}

// Mentor connection API endpoints
export async function connectWithMentor(mentorId) {
  const response = await api.post('/api/mentor/connect', { mentorId });
  return response.data;
}

export async function getMentorConnections() {
  const response = await api.get('/api/mentor/connections');
  return response.data;
}

export async function acceptMentorConnection(connectionId) {
  const response = await api.post(`/api/mentor/accept/${connectionId}`);
  return response.data;
}

export async function rejectMentorConnection(connectionId) {
  const response = await api.post(`/api/mentor/reject/${connectionId}`);
  return response.data;
}

export async function getLearnerConnections() {
  const response = await api.get('/api/mentor/learner-connections');
  return response.data;
}

// Session Request API endpoints
export async function createSessionRequest(mentorId, skillId, initialMessage) {
  try {
    const response = await api.post('/api/session-requests', { mentorId, skillId, initialMessage });
    return response.data;
  } catch (error) {
    console.error('Error creating session request:', error);
    throw error;
  }
}

export async function getSessionRequests() {
  try {
    const response = await api.get('/api/session-requests');
    return response.data;
  } catch (error) {
    console.error('Error fetching session requests:', error);
    throw error;
  }
}

export async function getSessionRequestMessages(sessionRequestId) {
  try {
    const response = await api.get(`/api/session-requests/${sessionRequestId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching session request messages:', error);
    throw error;
  }
}

export async function sendSessionRequestMessage(sessionRequestId, message, messageType = 'text', metadata = {}) {
  try {
    const response = await api.post(`/api/session-requests/${sessionRequestId}/messages`, { 
      message, 
      messageType, 
      metadata 
    });
    return response.data;
  } catch (error) {
    console.error('Error sending session request message:', error);
    throw error;
  }
}

export async function proposeSessionTime(sessionRequestId, proposedTime) {
  try {
    const response = await api.post(`/api/session-requests/${sessionRequestId}/proposetimes`, { proposedTime });
    return response.data;
  } catch (error) {
    console.error('Error proposing session time:', error);
    throw error;
  }
}

export async function respondToProposal(sessionRequestId, proposalId, response) {
  try {
    const res = await api.post(`/api/session-requests/${sessionRequestId}/proposetimes/${proposalId}/respond`, { response });
    return res.data;
  } catch (error) {
    console.error('Error responding to proposal:', error);
    throw error;
  }
}

export async function getSessionRequestJitsiLink(sessionRequestId) {
  try {
    const response = await api.get(`/api/session-requests/${sessionRequestId}/jitsilink`);
    return response.data;
  } catch (error) {
    console.error('Error getting session request Jitsi link:', error);
    throw error;
  }
}

// WebRTC Session API endpoints
export async function createWebRTCSession(sessionData) {
  try {
    const response = await api.post('/api/sessions/webrtc-simple', sessionData);
    return response.data;
  } catch (error) {
    console.error('Error creating WebRTC session:', error);
    throw error;
  }
}

// Session completion API endpoint
export async function completeSession(sessionId, feedbackData) {
  try {
    const response = await api.post(`/api/sessions/complete/${sessionId}`, feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
}

// Mentor leaderboard API endpoint
export async function getMentorLeaderboard() {
  try {
    const response = await api.get('/api/sessions/leaderboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching mentor leaderboard:', error);
    throw error;
  }
}

export default api;