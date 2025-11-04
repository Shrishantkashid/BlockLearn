import React, { useState, useEffect } from 'react';
import { getMatchingMentors, getMatchDetail } from '../api';

const MatchingSystem = ({ skillId, onMentorSelect }) => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [matchDetail, setMatchDetail] = useState(null);

  useEffect(() => {
    if (skillId) {
      fetchMatchingMentors();
    }
  }, [skillId]);

  const fetchMatchingMentors = async () => {
    setLoading(true);
    try {
      const response = await getMatchingMentors(skillId);
      setMentors(response.data || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMentorClick = async (mentor) => {
    setSelectedMentor(mentor);
    try {
      const response = await getMatchDetail(mentor.user.id, skillId);
      setMatchDetail(response.data);
      if (onMentorSelect) {
        onMentorSelect(mentor);
      }
    } catch (error) {
      console.error('Error fetching match detail:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Finding the best mentors for you...</div>;
  }

  return (
    <div className="matching-system">
      <h3 className="text-xl font-bold mb-4">Recommended Mentors</h3>
      
      {mentors.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No mentors found for this skill. Try another skill or check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentors.map((mentor) => (
            <div 
              key={mentor.user.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedMentor?.user.id === mentor.user.id 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'border-gray-200'
              }`}
              onClick={() => handleMentorClick(mentor)}
            >
              <div className="flex items-center mb-3">
                {mentor.user.avatar_url ? (
                  <img 
                    src={mentor.user.avatar_url} 
                    alt={`${mentor.user.first_name} ${mentor.user.last_name}`}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                    {mentor.user.first_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-semibold">
                    {mentor.user.first_name} {mentor.user.last_name}
                  </h4>
                  <div className="text-sm text-gray-600">
                    Match Score: {Math.round(mentor.matchScore * 100)}%
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${mentor.matchScore * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {mentor.profile.bio && (
                <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                  {mentor.profile.bio}
                </p>
              )}
              
              {mentor.profile.campus && (
                <div className="text-xs text-gray-500">
                  🏫 {mentor.profile.campus}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {matchDetail && (
        <div className="mt-6 p-4 border rounded-lg bg-blue-50">
          <h4 className="font-bold mb-2">Match Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(matchDetail.scoreBreakdown).map(([factor, data]) => (
              <div key={factor} className="text-center">
                <div className="text-sm font-medium capitalize">{factor}</div>
                <div className="text-lg font-bold">{Math.round(data.score * 100)}%</div>
                <div className="text-xs text-gray-600">
                  {Math.round(data.contribution * 100)}% weight
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              {matchDetail.recommendation}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingSystem;