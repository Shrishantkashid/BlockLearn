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
    
    return children;
  } catch (error) {
    console.error("Error in ProtectedRoute:", error);
    // Redirect to pre-login page if there's an error
    return <Navigate to="/prelogin" replace />;
  }
};

export default ProtectedRoute;