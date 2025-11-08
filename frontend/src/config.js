// Use environment variable for API URL, fallback to localhost for development
// For Vercel deployments, VITE_API_URL should be set to the Vercel deployment URL
export const API_URL = import.meta.env.VITE_API_URL || 
                     (typeof window !== 'undefined' && window.location.origin) || 
                     "http://localhost:5000";