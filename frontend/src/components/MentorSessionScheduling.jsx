import React, { useState } from 'react';
import { Calendar, Clock, MapPin, MessageSquare, User } from 'lucide-react';
import api from '../api';

const MentorSessionScheduling = ({ mentor, skill, onSessionScheduled }) => {
  const [sessionForm, setSessionForm] = useState({
    scheduled_at: '',
    duration_minutes: 60,
    location: '',
    notes: ''
  });
  const [scheduling, setScheduling] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    setScheduling(true);
    setFormError('');
    setSuccessMessage('');

    try {
      // Send session data to the backend
      const sessionData = {
        mentor_id: mentor.id,
        skill_id: skill.id,
        scheduled_at: sessionForm.scheduled_at,
        duration_minutes: sessionForm.duration_minutes,
        location: sessionForm.location,
        notes: sessionForm.notes
      };

      const response = await api.post('/api/sessions', sessionData);
      
      if (response.data.success) {
        setSuccessMessage('Session scheduled successfully!');
        setSessionForm({
          scheduled_at: '',
          duration_minutes: 60,
          location: '',
          notes: ''
        });
        
        // Notify parent component that session was scheduled
        if (onSessionScheduled) {
          onSessionScheduled({
            ...sessionForm,
            mentor,
            skill
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to schedule session');
      }
    } catch (error) {
      setFormError(error.message || 'Failed to schedule session. Please try again.');
      console.error('Error scheduling session:', error);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-primary dark:bg-primary/90 p-4">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-white mr-2" />
          <h3 className="text-lg font-semibold text-white">
            Schedule Session with {mentor.first_name} {mentor.last_name}
          </h3>
        </div>
        <p className="text-primary-100 text-sm mt-1">
          Skill: {skill.name}
        </p>
      </div>

      {/* Form */}
      <div className="p-6">
        {formError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg">
            {formError}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleScheduleSession} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={sessionForm.scheduled_at}
                onChange={(e) => setSessionForm({...sessionForm, scheduled_at: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration
              </label>
              <select
                value={sessionForm.duration_minutes}
                onChange={(e) => setSessionForm({...sessionForm, duration_minutes: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              placeholder="e.g., Online, Room 201, Zoom link"
              value={sessionForm.location}
              onChange={(e) => setSessionForm({...sessionForm, location: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Notes
            </label>
            <textarea
              placeholder="Any additional information for the session..."
              value={sessionForm.notes}
              onChange={(e) => setSessionForm({...sessionForm, notes: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={scheduling}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center"
            >
              {scheduling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                'Schedule Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorSessionScheduling;