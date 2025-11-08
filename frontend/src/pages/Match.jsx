import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllSkills, getMatchingMentors } from '../api';
import MatchingSystem from '../components/MatchingSystem';

function Match() {
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await getAllSkills();
      if (response.success) {
        setSkills(response.data);
      }
    } catch (err) {
      console.error('Error fetching skills:', err);
      setError('Failed to load skills');
    }
  };

  const handleSkillChange = (e) => {
    setSelectedSkill(e.target.value);
  };

  const handleSearch = () => {
    if (!selectedSkill) {
      setError('Please select a skill');
      return;
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold gradient-text">BlockLearn</h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/skills" className="text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Skills
              </Link>
              <Link to="/match" className="text-primary-600 dark:text-primary-400 font-medium">
                Match
              </Link>
              <Link to="/sessions" className="text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Sessions
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">Find Your Perfect Match</h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
            Connect with peers who can teach you new skills or learn from your expertise
          </p>
        </div>

        {/* Search Section */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Find Mentors by Skill</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Select a Skill</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={selectedSkill}
                onChange={handleSkillChange}
              >
                <option value="">Choose a skill...</option>
                {skills.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button 
                className="btn-primary w-full sm:w-auto"
                onClick={handleSearch}
              >
                Find Mentors
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Matching System */}
        {selectedSkill && (
          <div className="mt-8">
            <MatchingSystem skillId={selectedSkill} />
          </div>
        )}

        {/* Information Section */}
        {!selectedSkill && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Find Your Perfect Learning Partner</h3>
            <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              Select a skill above to discover mentors who can help you learn. Our smart matching algorithm 
              connects you with the best peers based on skills, availability, and experience.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Match;