import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  User, 
  Mail, 
  Calendar, 
  GraduationCap, 
  Briefcase, 
  Award, 
  BookOpen, 
  Clock,
  UserCheck,
  UserX,
  ArrowLeft,
  Video,
  MapPin,
  Plus,
  Edit,
  X
} from "lucide-react";

export default function AdminMentorApplication() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: "",
    durationMinutes: 30
  });
  const { mentorId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMentorApplication();
  }, [mentorId]);

  const fetchMentorApplication = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/mentor-application/${mentorId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setApplication(data.data);
      }
    } catch (error) {
      console.error("Error fetching mentor application:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveMentor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/mentor-approve/${mentorId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Mentor approved successfully!");
        navigate("/admin/dashboard");
      } else {
        alert("Error approving mentor: " + data.message);
      }
    } catch (error) {
      console.error("Error approving mentor:", error);
      alert("Error approving mentor");
    }
  };

  const rejectMentor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/mentor-reject/${mentorId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Mentor rejected successfully!");
        navigate("/admin/dashboard");
      } else {
        alert("Error rejecting mentor: " + data.message);
      }
    } catch (error) {
      console.error("Error rejecting mentor:", error);
      alert("Error rejecting mentor");
    }
  };

  const openScheduleModal = () => {
    // Set default date to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setScheduleData({
      scheduledAt: tomorrow.toISOString().slice(0, 16),
      durationMinutes: 30
    });
    setShowScheduleModal(true);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setScheduleData({
      scheduledAt: "",
      durationMinutes: 30
    });
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/schedule-interview/${mentorId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          scheduledAt: scheduleData.scheduledAt,
          durationMinutes: scheduleData.durationMinutes
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Interview scheduled successfully!");
        closeScheduleModal();
        // Refresh the application data to show the new interview
        fetchMentorApplication();
      } else {
        alert("Error scheduling interview: " + data.message);
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      alert("Error scheduling interview");
    }
  };

  const updateInterview = () => {
    // In a real implementation, this would open a modal to update interview details
    alert("Update interview functionality would go here");
  };

  const cancelInterview = async () => {
    if (!application || !application.interview) return;
    
    if (!window.confirm("Are you sure you want to cancel this interview?")) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cancel-interview/${application.interview._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Interview cancelled successfully!");
        // Refresh the application data to show the cancelled interview
        fetchMentorApplication();
      } else {
        alert("Error cancelling interview: " + data.message);
      }
    } catch (error) {
      console.error("Error cancelling interview:", error);
      alert("Error cancelling interview");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">Application not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            The mentor application could not be found.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Mentor Application</h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            Review and manage {application.user.firstName} {application.user.lastName}'s application
          </p>
        </div>

        {/* Application Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                {application.user.firstName} {application.user.lastName}
              </h2>
              <p className="text-gray-600 dark:text-slate-400">{application.user.email}</p>
              <div className="mt-2 flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending Review
                </span>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={rejectMentor}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <UserX className="w-4 h-4 mr-2" />
                Reject
              </button>
              <button
                onClick={approveMentor}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Approve
              </button>
            </div>
          </div>
        </div>

        {/* Interview Information */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 flex items-center">
              <Video className="w-5 h-5 mr-2" />
              Interview
            </h3>
            {!application.interview ? (
              <button
                onClick={openScheduleModal}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Schedule
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={updateInterview}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={cancelInterview}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
              </div>
            )}
          </div>
          
          {application.interview ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Interview Date
                </label>
                <p className="text-gray-900 dark:text-slate-100">
                  {new Date(application.interview.scheduled_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Interview Time
                </label>
                <p className="text-gray-900 dark:text-slate-100">
                  {new Date(application.interview.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Duration
                </label>
                <p className="text-gray-900 dark:text-slate-100">
                  {application.interview.duration_minutes} minutes
                </p>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Admin Meeting Link
                </label>
                <p className="text-gray-900 dark:text-slate-100 break-all">
                  {application.interview.admin_meeting_link || 'Not available'}
                </p>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Mentor Meeting Link
                </label>
                <p className="text-gray-900 dark:text-slate-100 break-all">
                  {application.interview.meeting_link || 'Not available'}
                </p>
              </div>
              <div className="sm:col-span-3">
                <a
                  href={application.interview.admin_meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Interview as Admin
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Video className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">No Interview Scheduled</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Click the "Schedule" button to schedule an interview for this mentor.
              </p>
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                First Name
              </label>
              <p className="text-gray-900 dark:text-slate-100">{application.user.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Last Name
              </label>
              <p className="text-gray-900 dark:text-slate-100">{application.user.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-slate-100">{application.user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Application Date
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {new Date(application.user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2" />
            Academic Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Degree
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {application.application?.academic_details?.degree || "Not provided"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Institution
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {application.application?.academic_details?.institution || "Not provided"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Major
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {application.application?.academic_details?.major || "Not provided"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Graduation Year
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {application.application?.academic_details?.graduationYear || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Teaching Experience */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Teaching Experience
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Professional Teacher
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {application.application?.teaching_experience?.isProfessionalTeacher ? "Yes" : "No"}
              </p>
            </div>
            {application.application?.teaching_experience?.isProfessionalTeacher && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Work Details
                </label>
                <p className="text-gray-900 dark:text-slate-100">
                  {application.application?.teaching_experience?.workDetails || "Not provided"}
                </p>
              </div>
            )}
            {!application.application?.teaching_experience?.isProfessionalTeacher && (
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                  Resume/CV
                </label>
                <p className="text-gray-900 dark:text-slate-100">
                  {application.application?.teaching_experience?.resume ? "Uploaded" : "Not provided"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Skills
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">
                Teaching Skills
              </label>
              {application.application?.skills && application.application.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {application.application.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary dark:bg-primary/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-slate-400">No skills provided</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">
                Certificates
              </label>
              <p className="text-gray-900 dark:text-slate-100">
                {application.application?.teaching_experience?.certificates ? "Uploaded" : "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            onClick={rejectMentor}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <UserX className="w-4 h-4 mr-2" />
            Reject Application
          </button>
          <button
            onClick={approveMentor}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Approve Application
          </button>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
                Schedule Interview for {application.user.firstName} {application.user.lastName}
              </h3>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Interview Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={scheduleData.scheduledAt}
                    onChange={(e) => setScheduleData({...scheduleData, scheduledAt: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Duration (minutes)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={scheduleData.durationMinutes}
                    onChange={(e) => setScheduleData({...scheduleData, durationMinutes: parseInt(e.target.value)})}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeScheduleModal}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Schedule Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}