import React, { useState, useEffect } from 'react';
import { getMatchingMentors, getMatchDetail, searchMentors } from '../api';
import { useNavigate } from 'react-router-dom';

const MatchingSystem = ({ skillId, searchFilters, onMentorSelect }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [matchDetail, setMatchDetail] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (skillId || (searchFilters && (searchFilters.name || searchFilters.campus || searchFilters.minMatchScore))) {
      fetchMatchingMentors();
    }
  }, [skillId, searchFilters]);

  const fetchMatchingMentors = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (searchFilters && (searchFilters.name || searchFilters.campus || searchFilters.minMatchScore)) {
        // Use advanced search
        response = await searchMentors({
          skillId: skillId || '',
          name: searchFilters.name || '',
          campus: searchFilters.campus || '',
          minMatchScore: searchFilters.minMatchScore || ''
        });
      } else if (skillId) {
        // Use basic skill-based search
        response = await getMatchingMentors(skillId);
      } else {
        // No search criteria
        setMentors([]);
        setLoading(false);
        return;
      }
      
      if (response.success) {
        setMentors(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch mentors');
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setError('Failed to fetch mentors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMentorClick = async (mentor) => {
    setSelectedMentor(mentor);
    try {
      const response = await getMatchDetail(mentor.user.id, skillId);
      if (response.success) {
        setMatchDetail(response.data);
        if (onMentorSelect) {
          onMentorSelect(mentor);
        }
      } else {
        setError(response.message || 'Failed to fetch match details');
      }
    } catch (error) {
      console.error('Error fetching match detail:', error);
      setError('Failed to fetch match details. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-slate-400">Finding the best mentors for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p className="text-red-700 dark:text-red-300 text-center">{error}</p>
        <div className="text-center mt-4">
          <button 
            onClick={fetchMatchingMentors}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="matching-system">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Recommended Mentors</h3>
      
      {mentors.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-600 dark:text-slate-400">
            No mentors found for this skill. Try another skill or check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div 
              key={mentor.user.id}
              className={`border rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedMentor?.user.id === mentor.user.id 
                  ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-slate-800' 
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
              onClick={() => handleMentorClick(mentor)}
            >
              <div className="flex items-center mb-4">
                {mentor.user.avatar_url ? (
                  <img 
                    src={mentor.user.avatar_url} 
                    alt={`${mentor.user.first_name} ${mentor.user.last_name}`}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl mr-4">
                    {mentor.user.first_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-slate-100">
                    {mentor.user.first_name} {mentor.user.last_name}
                  </h4>
                  <div className="flex items-center mt-1">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {Math.round(mentor.matchScore * 100)}% Match
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${mentor.matchScore * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {mentor.profile.bio && (
                <p className="text-gray-700 dark:text-slate-300 mb-4 text-sm line-clamp-3">
                  {mentor.profile.bio}
                </p>
              )}
              
              {mentor.profile.campus && (
                <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-2">
                  <span className="mr-2">🏫</span>
                  <span>{mentor.profile.campus}</span>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button 
                  className="w-full btn-primary text-sm"
                  onClick={() => navigate(`/mentor/profile/${mentor.user.id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {matchDetail && (
        <div className="mt-8 p-6 border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <h4 className="font-bold text-xl text-gray-900 dark:text-slate-100 mb-4">Match Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(matchDetail.scoreBreakdown).map(([factor, data]) => (
              <div key={factor} className="text-center bg-white dark:bg-slate-800 p-3 rounded-lg">
                <div className="text-sm font-medium capitalize text-gray-700 dark:text-slate-300">{factor}</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 my-1">{Math.round(data.score * 100)}%</div>
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  {Math.round(data.contribution * 100)}% weight
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {matchDetail.recommendation}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingSystem;