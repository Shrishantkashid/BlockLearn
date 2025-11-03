import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages that exist
import Index from "./pages/Index.jsx";
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
import BlockchainCertificates from "./pages/BlockchainCertificates.jsx";

// Demo pages
import DemoGlowingEffect from "./pages/DemoGlowingEffect.jsx";
import Demo3DHero from "./pages/Demo3DHero.tsx";
import DemoBeams from "./pages/DemoBeams.tsx";
import DemoLoginModern from "./pages/DemoLoginModern.tsx";

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/match" element={<Match />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/blockchain-certificates" element={<BlockchainCertificates />} />

        {/* Demo routes */}
        <Route path="/demo-glow" element={<DemoGlowingEffect />} />
        <Route path="/demo-3d" element={<Demo3DHero />} />
        <Route path="/demo-beams" element={<DemoBeams />} />
        <Route path="/demo-login" element={<DemoLoginModern />} />
      </Routes>
    </div>
  );
}

export default App;