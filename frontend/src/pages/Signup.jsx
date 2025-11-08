import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  MessageSquare, 
  Sparkles,
  User,
  Users
} from 'lucide-react';
import api from '../api';

const Signup = () => {
  const [step, setStep] = useState("form"); // "form" or "otp"
  const [userType, setUserType] = useState("learner"); // "learner" or "mentor"
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const navigate = useNavigate();

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Basic validation
    if (!firstName || !lastName || !email) {
      setMessage("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/auth/send-otp", {
        email: email,
        firstName: firstName,
        lastName: lastName,
        userType: userType,
        isNewUser: true
      });

      if (response.data.success) {
        setMessage("✅ OTP sent to your campus email!");
        setStep("otp");
      } else {
        setMessage(response.data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setMessage("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await api.post("/api/auth/verify-otp", {
        email: email,
        otp: otp,
        firstName: firstName,
        lastName: lastName,
        userType: userType,
        isNewUser: true
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Redirect based on user type
        if (userType === "mentor") {
          navigate("/mentor/onboarding");
        } else {
          navigate("/profile");
        }
      } else {
        setMessage(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setMessage("OTP verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <Sparkles className="w-10 h-10 text-[#2b57af]" />
              <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BlockLearn
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-[#2b57af] mb-2">
              Create Your Account
            </h2>
            <p className="text-[#2b57af]">
              Join the BlockLearn community today
            </p>
          </div>

          {/* Form Card */}
          <div
            className="backdrop-blur-md bg-white/50 dark:bg-slate-900/50 border border-border/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Gradient Blob Effect */}
            <div
              className={`absolute pointer-events-none w-[400px] h-[400px] bg-gradient-hero opacity-20 rounded-full blur-3xl transition-opacity duration-200 ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `translate(${mousePosition.x - 200}px, ${mousePosition.y - 200}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            />

            <div className="relative z-10">
              {step === "form" ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  {/* User Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#2b57af] mb-3">
                      I want to join as:
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setUserType("learner")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          userType === "learner"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Users className="w-8 h-8 mx-auto mb-2 text-[#2b57af]" />
                        <span className="font-medium text-[#2b57af]">Learner</span>
                        <p className="text-xs text-[#2b57af] mt-1">
                          Learn new skills from mentors
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType("mentor")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          userType === "mentor"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Users className="w-8 h-8 mx-auto mb-2 text-[#2b57af]" />
                        <span className="font-medium text-[#2b57af]">Mentor</span>
                        <p className="text-xs text-[#2b57af] mt-1">
                          Share your knowledge with others
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-[#2b57af] mb-2">
                        <User className="w-4 h-4 inline mr-1 text-[#2b57af]" />
                        First Name
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-[#2b57af] placeholder-[#2b57af] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-[#2b57af] mb-2">
                        <User className="w-4 h-4 inline mr-1 text-[#2b57af]" />
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-[#2b57af] placeholder-[#2b57af] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#2b57af] mb-2">
                      <Mail className="w-4 h-4 inline mr-1 text-[#2b57af]" />
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-[#2b57af] placeholder-[#2b57af] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground border border-primary/20 shadow-lg hover:bg-primary/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-[#2b57af] mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1 text-[#2b57af]" />
                      Enter OTP
                    </label>
                    <input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-[#2b57af] placeholder-[#2b57af] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
                      required
                    />
                    <p className="text-xs text-[#2b57af] mt-1">
                      OTP sent to: {email}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-8 py-4 rounded-xl bg-primary text-primary-foreground border border-primary/20 shadow-lg hover:bg-primary/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </form>
              )}

              {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  message.includes("✅") 
                    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800" 
                    : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                }`}>
                  {message}
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-[#2b57af]">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;