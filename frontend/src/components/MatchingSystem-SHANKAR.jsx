import React, { useState, useEffect } from 'react';
import { getMatchingMentors } from '../api';

function MatchingSystem({ skillId }) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (skillId) {
      fetchMatchingMentors();
    }
  }, [skillId]);

  const fetchMatchingMentors = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMatchingMentors(skillId);
      if (response.success) {
        setMentors(response.data);
      } else {
        setError(response.message || 'Failed to fetch mentors');
      }
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError('Failed to fetch mentors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (mentors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-slate-400">No mentors found for this skill.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Recommended Mentors</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((mentor) => (
          <div key={mentor.user.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              {mentor.user.avatar_url ? (
                <img 
                  src={mentor.user.avatar_url} 
                  alt={`${mentor.user.first_name} ${mentor.user.last_name}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {mentor.user.first_name.charAt(0)}{mentor.user.last_name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-slate-100">
                  {mentor.user.first_name} {mentor.user.last_name}
                </h4>
                {mentor.profile?.campus && (
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {mentor.profile.campus}
                  </p>
                )}
                {mentor.profile?.bio && (
                  <p className="text-sm text-gray-700 dark:text-slate-300 mt-2 line-clamp-2">
                    {mentor.profile.bio}
                  </p>
                )}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Match Score</span>
                    <span className="font-semibold text-primary">{Math.round(mentor.matchScore * 100)}%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${mentor.matchScore * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchingSystem;