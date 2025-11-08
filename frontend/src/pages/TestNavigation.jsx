import React from "react";
import { useNavigate, Link } from "react-router-dom";

export default function TestNavigation() {
  const navigate = useNavigate();
  
  const handleNavigate = (path) => {
    console.log("Navigating to:", path);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Navigation Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={() => handleNavigate("/")}
            className="w-full btn-primary px-6 py-3 text-center"
          >
            Go to Home
          </button>
          
          <button
            onClick={() => handleNavigate("/dashboard")}
            className="w-full btn-primary px-6 py-3 text-center"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={() => handleNavigate("/profile")}
            className="w-full btn-primary px-6 py-3 text-center"
          >
            Go to Profile Setup
          </button>
          
          <button
            onClick={() => handleNavigate("/profile/view")}
            className="w-full btn-primary px-6 py-3 text-center"
          >
            Go to Profile View
          </button>
          
          <Link 
            to="/profile/view" 
            className="block w-full btn-secondary px-6 py-3 text-center"
          >
            Link to Profile View
          </Link>
        </div>
      </div>
    </div>
  );
}