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
import MentorStudents from "./pages/MentorStudents.jsx";
import LearnerMentors from "./pages/LearnerMentors.jsx";
import MentorLeaderboard from "./pages/MentorLeaderboard.jsx";

// Interview pages
import InterviewCodeEntry from "./pages/InterviewCodeEntry.jsx";

// Live session pages
import LiveSession from "./pages/LiveSession.jsx";

// Mentor-Admin video call pages
import MentorAdminCallLanding from "./pages/MentorAdminCallLanding.jsx";

// Protected Route component
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Import the test component
import TestWebSocket from "./test-websocket.jsx";

// Import the admin login page
import AdminLogin from "./pages/AdminLogin.jsx";

// Import the schedule session page
import ScheduleSession from "./pages/ScheduleSession.jsx";

// Import the mutual session booking pages
import MentorSessionBookingPage from "./pages/MentorSessionBookingPage.jsx";
import LearnerSessionBookingPage from "./pages/LearnerSessionBookingPage.jsx";

// Import session requests pages
import SessionRequests from "./pages/SessionRequests.jsx";

// Import the Jitsi test page
import JitsiTestPage from "./pages/JitsiTestPage.jsx";

// Import the video call page
import VideoCallPage from "./pages/VideoCallPage.jsx";

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
      
      <Route path="/mentor/students" element={
        <ProtectedRoute>
          <MentorStudents />
        </ProtectedRoute>
      } />
      
      <Route path="/learner/mentors" element={
        <ProtectedRoute>
          <LearnerMentors />
        </ProtectedRoute>
      } />
      
      <Route path="/mentor/leaderboard" element={
        <ProtectedRoute>
          <MentorLeaderboard />
        </ProtectedRoute>
      } />
      
      <Route path="/mentor/profile/:mentorId" element={
        <ProtectedRoute>
          <MentorProfileView />
        </ProtectedRoute>
      } />
      
      {/* Mentor session booking route */}
      <Route path="/mentor/session-booking" element={
        <ProtectedRoute>
          <MentorSessionBookingPage />
        </ProtectedRoute>
      } />
      
      <Route path="/mentor/session-booking/:sessionId" element={
        <ProtectedRoute>
          <MentorSessionBookingPage />
        </ProtectedRoute>
      } />
      
      {/* Learner session booking route */}
      <Route path="/learner/session-booking" element={
        <ProtectedRoute>
          <LearnerSessionBookingPage />
        </ProtectedRoute>
      } />
      
      <Route path="/learner/session-booking/:sessionId" element={
        <ProtectedRoute>
          <LearnerSessionBookingPage />
        </ProtectedRoute>
      } />
      
      {/* Interview routes */}
      <Route path="/interview/code-entry" element={
        <ProtectedRoute>
          <InterviewCodeEntry />
        </ProtectedRoute>
      } />
      
      {/* Live session routes */}
      <Route path="/session/live/:code" element={
        <ProtectedRoute>
          <LiveSession />
        </ProtectedRoute>
      } />
      
      {/* Mentor-Admin video call routes */}
      <Route path="/mentor-admin-landing" element={<MentorAdminCallLanding />} />
      
      {/* Video call route */}
      <Route path="/video-call/:roomName" element={
        <ProtectedRoute>
          <VideoCallPage />
        </ProtectedRoute>
      } />
      
      {/* Schedule session route */}
      <Route path="/schedule-session/:sessionId" element={
        <ProtectedRoute>
          <ScheduleSession />
        </ProtectedRoute>
      } />
      
      {/* Session requests route */}
      <Route path="/session-requests" element={
        <ProtectedRoute>
          <SessionRequests />
        </ProtectedRoute>
      } />
      
      {/* Jitsi test route */}
      <Route path="/jitsi-test" element={<JitsiTestPage />} />
      
      {/* Catch-all route - redirect to pre-login instead of index */}
      <Route path="*" element={<Navigate to="/prelogin" replace />} />
    </Routes>
  );
}

export default App;