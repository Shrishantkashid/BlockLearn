import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'blue' }}>BlockLearn Application</h1>
      <p style={{ color: 'green', fontSize: '18px' }}>
        If you can see this, React is working!
      </p>
      <div>
        <a href="/signup" style={{ color: 'red', marginRight: '20px' }}>
          Go to Signup
        </a>
        <a href="/test-signup" style={{ color: 'purple' }}>
          Go to Test Page
        </a>
      </div>
    </div>
  );
}

export default SimpleApp;
