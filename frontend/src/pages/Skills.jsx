import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllSkills, getUserSkills, addUserSkill, removeUserSkill } from '../api';

function Skills() {
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newSkill, setNewSkill] = useState({ skill_id: '', skill_type: 'offered', proficiency_level: 3 });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [skillsRes, userSkillsRes] = await Promise.all([
        getAllSkills(),
        getUserSkills()
      ]);

      if (skillsRes.success) {
        setSkills(skillsRes.data);
      }

      if (userSkillsRes.success) {
        setUserSkills(userSkillsRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.skill_id) {
      setError('Please select a skill');
      return;
    }

    try {
      const response = await addUserSkill(newSkill);
      if (response.success) {
        setNewSkill({ skill_id: '', skill_type: 'offered', proficiency_level: 3 });
        setShowAddForm(false);
        setError('');
        fetchAllData(); // Refresh the data
      } else {
        setError(response.message || 'Failed to add skill');
      }
    } catch (err) {
      console.error('Error adding skill:', err);
      setError('Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId, skillType) => {
    try {
      const response = await removeUserSkill(skillId, skillType);
      if (response.success) {
        fetchAllData(); // Refresh the data
      } else {
        setError(response.message || 'Failed to remove skill');
      }
    } catch (err) {
      console.error('Error removing skill:', err);
      setError('Failed to remove skill');
    }
  };

  const offeredSkills = userSkills.filter(skill => skill.skill_type === 'offered');
  const neededSkills = userSkills.filter(skill => skill.skill_type === 'needed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Loading skills...</p>
        </div>
      </div>
    );
  }

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
              <Link to="/skills" className="text-primary-600 dark:text-primary-400 font-medium">
                Skills
              </Link>
              <Link to="/match" className="text-gray-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">Skills Marketplace</h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover skills you can learn or share your expertise with fellow students
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skills I Can Teach */}
          <section className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Skills I Can Teach</h2>
              <button 
                onClick={() => {
                  setNewSkill({ skill_id: '', skill_type: 'offered', proficiency_level: 3 });
                  setShowAddForm(true);
                }}
                className="btn-primary text-sm"
              >
                Add Skill
              </button>
            </div>

            {showAddForm && newSkill.skill_type === 'offered' && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Add New Teaching Skill</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Skill</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={newSkill.skill_id}
                      onChange={(e) => setNewSkill({...newSkill, skill_id: e.target.value})}
                    >
                      <option value="">Choose a skill...</option>
                      {skills.map((skill) => (
                        <option key={skill._id} value={skill._id}>
                          {skill.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Proficiency Level</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={newSkill.proficiency_level}
                        onChange={(e) => setNewSkill({...newSkill, proficiency_level: parseInt(e.target.value)})}
                        className="w-full"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100 w-8">
                        {newSkill.proficiency_level}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddSkill}
                      className="btn-primary flex-1"
                    >
                      Add Skill
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {offeredSkills.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-gray-500 dark:text-slate-400">You haven't added any teaching skills yet.</p>
                </div>
              ) : (
                offeredSkills.map((skill) => (
                  <div 
                    key={`${skill.skill_id}-${skill.skill_type}`} 
                    className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-300">{skill.skill_name}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= skill.proficiency_level ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                            Level {skill.proficiency_level}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill(skill.skill_id, skill.skill_type)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Skills I Want to Learn */}
          <section className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Skills I Want to Learn</h2>
              <button 
                onClick={() => {
                  setNewSkill({ skill_id: '', skill_type: 'needed', proficiency_level: 1 });
                  setShowAddForm(true);
                }}
                className="btn-blue text-sm"
              >
                Add Learning Goal
              </button>
            </div>

            {showAddForm && newSkill.skill_type === 'needed' && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Add New Learning Goal</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Skill</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={newSkill.skill_id}
                      onChange={(e) => setNewSkill({...newSkill, skill_id: e.target.value})}
                    >
                      <option value="">Choose a skill...</option>
                      {skills.map((skill) => (
                        <option key={skill._id} value={skill._id}>
                          {skill.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Current Level</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={newSkill.proficiency_level}
                        onChange={(e) => setNewSkill({...newSkill, proficiency_level: parseInt(e.target.value)})}
                        className="w-full"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100 w-8">
                        {newSkill.proficiency_level}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddSkill}
                      className="btn-blue flex-1"
                    >
                      Add Goal
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {neededSkills.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-gray-500 dark:text-slate-400">You haven't added any learning goals yet.</p>
                </div>
              ) : (
                neededSkills.map((skill) => (
                  <div 
                    key={`${skill.skill_id}-${skill.skill_type}`} 
                    className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-amber-800 dark:text-amber-300">{skill.skill_name}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= skill.proficiency_level ? 'text-yellow-400' : 'text-gray-300 dark:text-slate-600'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-amber-600 dark:text-amber-400 ml-2">
                            Level {skill.proficiency_level}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSkill(skill.skill_id, skill.skill_type)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Browse All Skills */}
        <section className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">Browse All Skills</h2>
            <p className="text-gray-600 dark:text-slate-400">Explore the skills available in our community</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {skills.map((skill) => (
              <div 
                key={skill._id} 
                className="card text-center hover:shadow-lg transition-shadow cursor-pointer p-4"
              >
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">{skill.name}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{skill.category}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Skills;