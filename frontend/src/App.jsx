import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages that exist
import Index from "./pages/Index.jsx";
import PreLogin from "./pages/PreLogin.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Skills from "./pages/Skills.jsx";
import Match from "./pages/Match.jsx";
import Sessions from "./pages/Sessions.jsx";
import Settings from "./pages/Settings.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import SetPassword from "./pages/SetPassword.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";
import ProfileView from "./pages/ProfileView.jsx";
import TestNavigation from "./pages/TestNavigation.jsx";
import BlockchainCertificates from "./pages/BlockchainCertificates.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import TestRedirect from "./TestRedirect.jsx";
import RedirectTest from "./RedirectTest.jsx";

// Mentor pages
import MentorOnboarding from "./pages/MentorOnboarding.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import MentorProfileView from "./pages/MentorProfileView.jsx";
import MentorSessions from "./pages/MentorSessions.jsx";

// Interview pages
import InterviewCodeEntry from "./pages/InterviewCodeEntry.jsx";
import InterviewSession from "./pages/InterviewSession.jsx";

// Live session pages
import LiveSession from "./pages/LiveSession.jsx";

// Mentor-Admin video call pages
import MentorAdminVideoCall from "./pages/MentorAdminVideoCall.jsx";
import MentorAdminCallLanding from "./pages/MentorAdminCallLanding.jsx";

// WebRTC test page
import WebRTCTest from "./pages/WebRTCTest.jsx";

// Protected Route component
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Import the test component
import TestWebSocket from "./test-websocket.jsx";

// Import the admin login page
import AdminLogin from "./pages/AdminLogin.jsx";

// Import the admin interview session page
import AdminInterviewSession from "./pages/AdminInterviewSession.jsx";

// Import the schedule session page
import ScheduleSession from "./pages/ScheduleSession.jsx";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/prelogin" element={<PreLogin />} />
      <Route path="/pre-login" element={<PreLogin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/test" element={<TestNavigation />} />
      <Route path="/test-redirect" element={<TestRedirect />} />
      <Route path="/redirect-test" element={<RedirectTest />} />
      <Route path="/test-websocket" element={<TestWebSocket />} />
      
      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/interview/:code" element={
        <ProtectedRoute>
          <AdminInterviewSession />
        </ProtectedRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/skills" element={
        <ProtectedRoute>
          <Skills />
        </ProtectedRoute>
      } />
      
      <Route path="/match" element={
        <ProtectedRoute>
          <Match />
        </ProtectedRoute>
      } />
      
      <Route path="/sessions" element={
        <ProtectedRoute>
          <Sessions />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <StudentProfile />
        </ProtectedRoute>
      } />
      
      <Route path="/profile/view" element={
        <ProtectedRoute>
          <ProfileView />
        </ProtectedRoute>
      } />
      
      <Route path="/blockchain" element={
        <ProtectedRoute>
          <BlockchainCertificates />
        </ProtectedRoute>
      } />
      
      {/* Mentor routes */}
      <Route path="/mentor/onboarding" element={
        <ProtectedRoute>
          <MentorOnboarding />
        </ProtectedRoute>
      } />
      
      <Route path="/mentor/dashboard" element={
        <ProtectedRoute>
          <MentorDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/mentor/sessions" element={
        <ProtectedRoute>
          <MentorSessions />
        </ProtectedRoute>
      } />
      
      <Route path="/mentor/profile/:mentorId" element={
        <ProtectedRoute>
          <MentorProfileView />
        </ProtectedRoute>
      } />
      
      {/* Interview routes */}
      <Route path="/interview/code-entry" element={
        <ProtectedRoute>
          <InterviewCodeEntry />
        </ProtectedRoute>
      } />
      
      <Route path="/mentor/interview/:code" element={
        <ProtectedRoute>
          <InterviewSession />
        </ProtectedRoute>
      } />
      
      {/* Live session routes */}
      <Route path="/session/live/:code" element={
        <ProtectedRoute>
          <LiveSession />
        </ProtectedRoute>
      } />
      
      {/* Mentor-Admin video call routes */}
      <Route path="/mentor-admin-call" element={<MentorAdminVideoCall />} />
      <Route path="/mentor-admin-landing" element={<MentorAdminCallLanding />} />
      
      {/* WebRTC test route */}
      <Route path="/webrtc-test" element={<WebRTCTest />} />
      
      {/* Schedule session route */}
      <Route path="/schedule-session/:sessionId" element={
        <ProtectedRoute>
          <ScheduleSession />
        </ProtectedRoute>
      } />
      
      {/* Catch-all route - redirect to pre-login instead of index */}
      <Route path="*" element={<Navigate to="/prelogin" replace />} />
    </Routes>
  );
}

export default App;