import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, Users } from 'lucide-react';
import { getMentorLeaderboard } from '../api';

const MentorLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await getMentorLeaderboard();
      
      if (response.success) {
        setLeaderboard(response.data);
      } else {
        setError('Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Error loading leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-slate-400">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center">
                <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                Mentor Leaderboard
              </h1>
              <p className="text-gray-600 dark:text-slate-400 mt-2">
                Top performing mentors based on ratings and sessions completed
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                No mentors found
              </h3>
              <p className="text-gray-600 dark:text-slate-400">
                Leaderboard data will appear once mentors have completed sessions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {leaderboard.map((mentor, index) => (
                <div
                  key={mentor.id}
                  className={`p-6 flex items-center ${
                    index === 0
                      ? 'bg-yellow-50 dark:bg-yellow-900/10'
                      : index === 1
                      ? 'bg-gray-50 dark:bg-slate-700/10'
                      : index === 2
                      ? 'bg-amber-50 dark:bg-amber-900/10'
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12">
                    {index === 0 ? (
                      <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">1</span>
                      </div>
                    ) : index === 1 ? (
                      <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">2</span>
                      </div>
                    ) : index === 2 ? (
                      <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">3</span>
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Mentor Info */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                          {mentor.first_name} {mentor.last_name}
                        </h3>
                        <p className="text-gray-600 dark:text-slate-400 text-sm">
                          {mentor.email}
                        </p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900 dark:text-slate-100">
                            {mentor.total_sessions}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-slate-400 flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            Sessions
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex justify-center">
                            {renderStars(mentor.average_rating)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-slate-400">
                            Rating
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
            How is the leaderboard calculated?
          </h3>
          <p className="text-blue-700 dark:text-blue-300">
            Mentors are ranked based on their average rating and total number of sessions completed. 
            The higher your average rating and the more sessions you complete, the higher you'll rank!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentorLeaderboard;