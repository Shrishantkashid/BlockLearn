import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Sparkles, ArrowLeft, Lock, User, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@blocklearn.com");
  const [password, setPassword] = useState("admin");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/admin-login`, {
        email,
        password
      });
      
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userData", JSON.stringify(response.data.user));
      navigate("/admin/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "Admin login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-50 dark:bg-slate-950 text-foreground overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground 
        type="blobs" 
        intensity={0.6}
        disableOnMobile={true}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
              <Sparkles className="w-10 h-10 text-primary" />
              <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BlockLearn
              </span>
            </Link>
            <h2 className="text-3xl font-bold text-foreground mb-2">Admin Login</h2>
            <p className="text-muted-foreground">
              Sign in to access the admin dashboard
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
              <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
                Administrator Access
              </h3>
              
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div>
                  <label className="block text-sm text-foreground mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@blocklearn.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-foreground mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-card/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setEmail("admin@blocklearn.com");
                      setPassword("admin");
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-card dark:bg-slate-800 text-foreground border border-border shadow-sm hover:bg-card/80 dark:hover:bg-slate-800/80 transition-all font-medium"
                  >
                    Use Default Credentials
                  </button>
                  
                  <button 
                    type="submit"
                    disabled={isLoading} 
                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground border border-primary/20 shadow-lg hover:bg-primary/90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </>
                    ) : "Login"}
                  </button>
                </div>
              </form>

              {message && (
                <div className={`mt-4 p-4 rounded-xl backdrop-blur-sm ${
                  message.includes("success") || message.includes("✅")
                    ? "bg-primary/20 text-foreground border border-primary/30"
                    : "bg-destructive/20 text-foreground border border-destructive/30"
                }`}>
                  <div className="flex items-center">
                    {message.includes("success") || message.includes("✅") ? (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mr-2" />
                    )}
                    <span className="text-sm font-medium">{message}</span>
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Admin Credentials</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Email:</strong> admin@blocklearn.com<br />
                  <strong>Password:</strong> admin
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center space-y-4">
            <Link to="/login" className="text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to user login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}