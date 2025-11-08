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

// Generic API request
export async function apiRequest(endpoint, method = 'GET', data = null) {
  const response = await api.request({
    url: endpoint,
    method,
    data,
  });
  return response.data;
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
  return response.data;
}

// Matching API endpoints
export async function getMatchingMentors(skillId) {
  const response = await api.get(`/api/matching/mentors/${skillId}`);
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

export default api;