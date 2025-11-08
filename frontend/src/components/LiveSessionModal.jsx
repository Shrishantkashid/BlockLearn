import React, { useState } from 'react';
import { generateLiveSessionCode } from '../api';

const LiveSessionModal = ({ session, onClose, onCodeGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await generateLiveSessionCode(session.id);
      if (response.success) {
        onCodeGenerated(response.data);
      } else {
        setError(response.message || 'Failed to generate live session code');
      }
    } catch (err) {
      console.error('Error generating live session code:', err);
      setError('Failed to generate live session code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Start Live Session
        </h3>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            You're about to start a live session with {session.mentor.first_name} {session.mentor.last_name} 
            for {session.skill.name}.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• A unique code will be generated for this session</li>
              <li>• Share this code with your session partner</li>
              <li>• Both of you will join the same video call</li>
              <li>• The code expires after 1 hour</li>
            </ul>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-slate-100 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateCode}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Code'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveSessionModal;