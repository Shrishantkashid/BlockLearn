import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  try {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    // Check if user is logged in
    if (!token || !userData) {
      console.log("No token or userData found in localStorage");
      // Save the attempted location so we can redirect back after login
      const location = useLocation();
      // Redirect to pre-login page if not authenticated
      return <Navigate to="/prelogin" state={{ from: location }} replace />;
    }
    
    // Try to parse userData to verify it's valid JSON
    let parsedUser;
    try {
      parsedUser = JSON.parse(userData);
      console.log("Parsed user data:", parsedUser);
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
    
    // Additional validation: Check if token is expired
    try {
      // Decode JWT token to check expiration (without external libraries)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedToken = JSON.parse(jsonPayload);
      const currentTime = Date.now() / 1000;
      
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        // Token is expired
        console.log("Token expired, redirecting to login");
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        const location = useLocation();
        return <Navigate to="/prelogin" state={{ from: location }} replace />;
      }
    } catch (tokenError) {
      console.error("Error decoding token:", tokenError);
      // If we can't decode the token, assume it's invalid
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