import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  MessageSquare, 
  Sparkles,
  ArrowRight,
  User
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';

const Login = () => {
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Redirect based on user type
        if (parsedUser.userType === 'mentor') {
          // For mentors, always go to mentor dashboard where they can see their approval status
          navigate("/mentor/dashboard");
        } else {
          // Check if profile is complete
          if (!parsedUser.profileComplete) {
            navigate("/profile");
          } else {
            navigate("/dashboard");
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [navigate]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // Basic email validation
    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/api/auth/send-otp", {
        email: email,
        isNewUser: false  // This is for login, not registration
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
        isNewUser: false  // This is for login, not registration
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Redirect based on user type
        if (response.data.user.userType === 'mentor') {
          // For mentors, always go to mentor dashboard where they can see their approval status
          setMessage("✅ Login successful! Redirecting to mentor dashboard...");
          setTimeout(() => navigate("/mentor/dashboard"), 1500);
        } else {
          // Check if profile is complete
          if (!response.data.user.profileComplete) {
            setMessage("✅ Login successful! Redirecting to profile setup...");
            setTimeout(() => navigate("/profile"), 1500);
          } else {
            setMessage("✅ Login successful!");
            setTimeout(() => navigate("/dashboard"), 1500);
          }
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

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Redirect based on user type
        if (data.user.userType === 'mentor') {
          // For mentors, always go to mentor dashboard where they can see their approval status
          setMessage("✅ Login successful! Redirecting to mentor dashboard...");
          setTimeout(() => navigate("/mentor/dashboard"), 1500);
        } else {
          // Check if profile is complete
          if (!data.user.profileComplete) {
            setMessage("✅ Login successful! Redirecting to profile setup...");
            setTimeout(() => navigate("/profile"), 1500);
          } else {
            setMessage("✅ Login successful!");
            setTimeout(() => navigate("/dashboard"), 1500);
          }
        }
      } else {
        setMessage("Google login failed. Please try again.");
      }
    } catch (error) {
      setMessage("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage("Google login failed. Please try again.");
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-blue-100/20 to-indigo-100/20 dark:from-green-900/20 dark:via-blue-900/20 dark:to-indigo-900/20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/prelogin" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <Sparkles className="w-10 h-10 text-primary" />
              <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BlockLearn
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Sign in to your BlockLearn account
            </p>
          </div>

          {/* Form Card */}
          <div className="backdrop-blur-md bg-white/50 dark:bg-slate-900/50 border border-border/50 rounded-2xl p-8 shadow-2xl">
            {step === "email" ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
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
                  <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
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

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card/50 dark:bg-slate-900/50 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;