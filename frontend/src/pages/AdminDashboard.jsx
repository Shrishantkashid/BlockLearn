import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Use the api service instead of axios directly
import { Users, BookOpen, Award, CheckCircle, XCircle, Clock, Search } from "lucide-react";

function AdminDashboard() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [interviewCode, setInterviewCode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      // Use the public API endpoint
      const response = await api.get("/api/admin/mentor-interviews-public");
      
      if (response.data.success) {
        setMentors(response.data.data);
      } else {
        setMessage("Failed to fetch mentors: " + response.data.message);
      }
    } catch (error) {
      setMessage("Error fetching mentors: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinInterview = (code) => {
    // Navigate to the interview session within the app
    navigate(`/admin/interview/${code}`);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (interviewCode.trim()) {
      handleJoinInterview(interviewCode.trim());
      setShowCodeEntry(false);
      setInterviewCode("");
    }
  };

  const handleApproveMentor = async (mentorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/api/admin/mentor-approve/${mentorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessage("Mentor approved successfully");
        // Refresh the mentors list
        fetchMentors();
      } else {
        setMessage("Failed to approve mentor: " + response.data.message);
      }
    } catch (error) {
      setMessage("Error approving mentor: " + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectMentor = async (mentorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/api/admin/mentor-reject/${mentorId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setMessage("Mentor rejected successfully");
        // Refresh the mentors list
        fetchMentors();
      } else {
        setMessage("Failed to reject mentor: " + response.data.message);
      }
    } catch (error) {
      setMessage("Error rejecting mentor: " + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter mentors based on their status
  // We now use applicationStatus to distinguish between pending and rejected mentors
  // true means approved, 'rejected' applicationStatus means rejected, 'pending' or null/undefined means pending approval
  const pendingApprovalMentors = mentors.filter(mentor => 
    mentor.user?.mentorApproved !== true && 
    (!mentor.user?.applicationStatus || mentor.user?.applicationStatus === 'pending')
  );
  const approvedMentors = mentors.filter(mentor => mentor.user?.mentorApproved === true);
  const rejectedMentors = mentors.filter(mentor => 
    mentor.user?.mentorApproved === false && 
    mentor.user?.applicationStatus === 'rejected'
  );
  
  // Note: We now properly distinguish between pending and rejected mentors using applicationStatus

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCodeEntry(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Join Interview
              </button>
              <button
                onClick={fetchMentors}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Interview Code Entry Modal */}
      {showCodeEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Join Interview</h2>
              <button 
                onClick={() => setShowCodeEntry(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCodeSubmit}>
              <div className="mb-6">
                <label htmlFor="interviewCode" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Interview Code
                </label>
                <input
                  id="interviewCode"
                  type="text"
                  value={interviewCode}
                  onChange={(e) => setInterviewCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary dark:bg-slate-700 dark:text-slate-100"
                  maxLength={8}
                  required
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                  Enter the 8-character interview code
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCodeEntry(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Join Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <div className="mb-6 p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Mentors</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{mentors.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Pending Approval</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                  {pendingApprovalMentors.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Approved</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                  {approvedMentors.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
                  {rejectedMentors.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approval Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Pending Mentor Approvals</h2>
          </div>
          
          {pendingApprovalMentors.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">No pending approvals</h3>
              <p className="text-gray-500 dark:text-slate-400">All mentors have been reviewed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Interview Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Scheduled Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {pendingApprovalMentors.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-medium">
                                {item.user?.firstName?.charAt(0)}{item.user?.lastName?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {item.user?.firstName} {item.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">
                              {item.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100 font-mono">
                          {item.interview?.interview_code || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100">
                          {item.interview?.scheduled_at ? formatDate(item.interview.scheduled_at) : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.interview?.status)}`}>
                          {item.interview?.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveMentor(item.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve Mentor"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRejectMentor(item.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject Mentor"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          {item.interview?.interview_code && (
                            <button
                              onClick={() => handleJoinInterview(item.interview.interview_code)}
                              className="text-primary hover:text-primary/80"
                              title="Join Interview"
                            >
                              <Search className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approved Mentors Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Approved Mentors (Interview Scheduled)</h2>
          </div>
          
          {approvedMentors.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">No approved mentors</h3>
              <p className="text-gray-500 dark:text-slate-400">No mentors have been approved yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Interview Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Scheduled Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {approvedMentors.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                {item.user?.firstName?.charAt(0)}{item.user?.lastName?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {item.user?.firstName} {item.user?.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">
                              {item.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100 font-mono">
                          {item.interview?.interview_code || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100">
                          {item.interview?.scheduled_at ? formatDate(item.interview.scheduled_at) : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.interview?.status)}`}>
                          {item.interview?.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <span className="text-green-600 font-medium">Approved</span>
                          {item.interview?.interview_code && (
                            <button
                              onClick={() => handleJoinInterview(item.interview.interview_code)}
                              className="text-primary hover:text-primary/80"
                              title="Join Interview"
                            >
                              <Search className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rejected Mentors Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Rejected Mentors</h2>
          </div>
          
          {rejectedMentors.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-1">No rejected mentors</h3>
              <p className="text-gray-500 dark:text-slate-400">No mentors have been rejected yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {rejectedMentors.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {item.user?.firstName?.charAt(0)}{item.user?.lastName?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {item.user?.firstName} {item.user?.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-100">
                          {item.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-red-600 font-medium">Rejected</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;