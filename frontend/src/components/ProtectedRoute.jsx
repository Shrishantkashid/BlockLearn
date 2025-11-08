import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  try {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    // Check if user is logged in
    if (!token || !userData) {
      // Save the attempted location so we can redirect back after login
      const location = useLocation();
      // Redirect to pre-login page if not authenticated
      return <Navigate to="/prelogin" state={{ from: location }} replace />;
    }
    
    // Try to parse userData to verify it's valid JSON
    let parsedUser;
    try {
      parsedUser = JSON.parse(userData);
    } catch (parseError) {
      console.error("Invalid userData in localStorage:", userData);
      // Clear invalid data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      const location = useLocation();
      return <Navigate to="/prelogin" state={{ from: location }} replace />;
    }
    
    // Validate user data structure
    if (!parsedUser.id || !parsedUser.email) {
      console.error("Invalid user data structure:", parsedUser);
      // Clear invalid data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      const location = useLocation();
      return <Navigate to="/prelogin" state={{ from: location }} replace />;
    }
    
    return children;
  } catch (error) {
    console.error("Error in ProtectedRoute:", error);
    // Clear potentially corrupted auth data
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    // Redirect to pre-login page if there's an error
    const location = useLocation();
    return <Navigate to="/prelogin" state={{ from: location }} replace />;
  }
};

export default ProtectedRoute;