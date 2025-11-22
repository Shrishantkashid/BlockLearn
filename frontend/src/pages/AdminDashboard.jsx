import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api"; // Use the api service instead of axios directly
import { Users, BookOpen, Award, CheckCircle, XCircle, Clock, Search, Lock, ArrowRight } from "lucide-react";

function AdminDashboard() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
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

  const handleJoinInterview = () => {
    // Instead of showing the code entry modal, directly redirect to a moderator Jitsi link
    // Generate a unique room name for the interview using crypto.randomUUID()
    const roomName = crypto.randomUUID();
    // Redirect to the moderator Jitsi link with the correct format
    window.location.href = `https://moderated.jitsi.net/a4840976807a4c4eb7f1b3591514d4b66cec6dc2e4ec44879911c3f7490456fe`;
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
  
  // Check if user is actually an admin
  const userData = localStorage.getItem('userData');
  const user = userData ? JSON.parse(userData) : null;
  const isAdmin = user && user.userType === 'admin';
  
  // Note: We now properly distinguish between pending and rejected mentors using applicationStatus

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  // If user is not admin, show access denied message
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="w-full max-w-md p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="mb-6 text-gray-600 dark:text-slate-400">
            You don't have permission to access the admin dashboard. Please log in as an administrator.
          </p>
          <Link 
            to="/admin/login" 
            className="inline-flex items-center px-4 py-2 text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
          >
            Go to Admin Login
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white shadow-sm dark:bg-slate-800">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <div className="flex gap-3">
              <button 
                onClick={handleJoinInterview}
                className="px-4 py-2 text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
              >
                Join Interview
              </button>
              <button
                onClick={fetchMentors}
                className="px-4 py-2 text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Message Display */}
        {message && (
          <div className="p-4 mb-6 text-blue-800 bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Mentors</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{mentors.length}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/20">
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

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
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

          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/20">
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
        <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="pb-4 mb-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Pending Mentor Approvals</h2>
          </div>
          
          {pendingApprovalMentors.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 mb-1 text-lg font-medium text-gray-900 dark:text-slate-100">No pending approvals</h3>
              <p className="text-gray-500 dark:text-slate-400">All mentors have been reviewed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Mentor
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Interview Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Scheduled Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-slate-700 dark:bg-slate-800">
                  {pendingApprovalMentors.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                              <span className="font-medium text-primary">
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
                        <div className="font-mono text-sm text-gray-900 dark:text-slate-100">
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
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
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
                              onClick={() => {
                                // For individual mentor interviews, redirect to the specific room
                                if (item.interview?.jitsi_room_name) {
                                  window.location.href = `https://moderated.jitsi.net/${item.interview.jitsi_room_name}`;
                                }
                              }}
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
        <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="pb-4 mb-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Approved Mentors (Interview Scheduled)</h2>
          </div>
          
          {approvedMentors.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 mb-1 text-lg font-medium text-gray-900 dark:text-slate-100">No approved mentors</h3>
              <p className="text-gray-500 dark:text-slate-400">No mentors have been approved yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Mentor
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Interview Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Scheduled Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-slate-700 dark:bg-slate-800">
                  {approvedMentors.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full dark:bg-green-900/20">
                              <span className="font-medium text-green-600 dark:text-green-400">
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
                        <div className="font-mono text-sm text-gray-900 dark:text-slate-100">
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
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <div className="flex space-x-2">
                          <span className="font-medium text-green-600">Approved</span>
                          {item.interview?.interview_code && (
                            <button
                              onClick={() => {
                                // For individual mentor interviews, redirect to the specific room
                                if (item.interview?.jitsi_room_name) {
                                  window.location.href = `https://moderated.jitsi.net/${item.interview.jitsi_room_name}`;
                                }
                              }}
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
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="pb-4 mb-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Rejected Mentors</h2>
          </div>
          
          {rejectedMentors.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="mt-2 mb-1 text-lg font-medium text-gray-900 dark:text-slate-100">No rejected mentors</h3>
              <p className="text-gray-500 dark:text-slate-400">No mentors have been rejected yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Mentor
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:divide-slate-700 dark:bg-slate-800">
                  {rejectedMentors.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full dark:bg-red-900/20">
                              <span className="font-medium text-red-600 dark:text-red-400">
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
                        <span className="inline-flex px-2 text-xs font-semibold leading-5 text-red-800 bg-red-100 rounded-full">
                          Rejected
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                        <span className="font-medium text-red-600">Rejected</span>
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