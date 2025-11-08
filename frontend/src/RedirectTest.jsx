import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectTest = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to pre-login page after 2 seconds
    const timer = setTimeout(() => {
      navigate('/prelogin');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Redirect Test</h1>
        <p className="mb-4">You will be redirected to the pre-login page in 2 seconds...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
};

export default RedirectTest;