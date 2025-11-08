import React from 'react';
import { Copy, Check } from 'lucide-react';

const LiveSessionCode = ({ liveSessionData, onCopyCode, onJoinSession }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(liveSessionData.live_session_code);
    setCopied(true);
    if (onCopyCode) onCopyCode(liveSessionData.live_session_code);
    
    // Reset copied status after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-auto">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4 text-center">
        Live Session Ready!
      </h3>
      
      <div className="mb-6 text-center">
        <p className="text-gray-600 dark:text-slate-400 mb-2">
          Share this code with your session partner:
        </p>
        
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gray-100 dark:bg-slate-700 rounded-lg px-6 py-4">
            <span className="text-3xl font-bold tracking-widest text-gray-900 dark:text-slate-100">
              {liveSessionData.live_session_code}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleCopyCode}
          className="flex items-center justify-center mx-auto px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </>
          )}
        </button>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Important:</strong> This code expires in 1 hour. Make sure both participants join before then.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onJoinSession(liveSessionData.live_session_code)}
          className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Join Session Now
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
        >
          Generate New Code
        </button>
      </div>
    </div>
  );
};

export default LiveSessionCode;