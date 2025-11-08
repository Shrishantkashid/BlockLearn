import React from 'react';
import { useNavigate } from 'react-router-dom';

const TestRedirect = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/prelogin');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Test Redirect</h1>
        <button 
          onClick={handleRedirect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Pre-Login
        </button>
      </div>
    </div>
  );
};

export default TestRedirect;