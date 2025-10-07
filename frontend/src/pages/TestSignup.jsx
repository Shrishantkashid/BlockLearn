import React from 'react';

const TestSignup = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Test Signup Page</h1>
        <p className="text-gray-600 text-center">If you can see this, React is working!</p>
        <div className="mt-4">
          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestSignup;
