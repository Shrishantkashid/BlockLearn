import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Calendar, MessageSquare, Search, X } from 'lucide-react';
import { getMentorConnections, getSessionRequests } from '../api';
import SessionBookingChat from '../components/SessionBookingChat';

const MentorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchSessionRequests();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getMentorConnections();
      console.log('API Response:', response); // Debug log
      if (response.success) {
        // Filter only accepted connections
        const acceptedStudents = response.data.filter(connection => connection.status === 'accepted');
        console.log('Accepted Students:', acceptedStudents); // Debug log
        // Map to the structure we need for display
        const mappedStudents = acceptedStudents.map(connection => ({
          id: connection.learner.id,
          first_name: connection.learner.first_name,
          last_name: connection.learner.last_name,
          email: connection.learner.email,
          connection_date: connection.created_at,
          session_count: 0 // We'll need to fetch this separately or from another source
        }));
        setStudents(mappedStudents);
      } else {
        console.error('API returned success=false:', response.message);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionRequests = async () => {
    try {
      const response = await getSessionRequests();
      if (response.success) {
        setSessionRequests(response.data);
      }
    } catch (error) {
      console.error('Error fetching session requests:', error);
    }
  };

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           student.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleOpenChat = async (student) => {
    try {
      // Check if there's already a session request for this student
      const existingRequest = sessionRequests.find(request => 
        request.student.id === student.id && request.mentor.id === JSON.parse(localStorage.getItem('userData') || '{}').id
      );
      
      if (existingRequest) {
        // Use existing session request
        setSelectedStudent(student);
        setShowChat(true);
        setSessionId(existingRequest._id);
      } else {
        // Create a consistent temporary session ID for WebRTC chat
        const mentorId = JSON.parse(localStorage.getItem('userData') || '{}').id;
        const studentId = student.id;
        // Sort the IDs to ensure consistency
        const sortedIds = [mentorId, studentId].sort();
        const consistentSessionId = `temp_${sortedIds[0]}_${sortedIds[1]}`;
        
        setSelectedStudent(student);
        setShowChat(true);
        setSessionId(consistentSessionId);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      // Fallback to placeholder if API fails
      const mentorId = JSON.parse(localStorage.getItem('userData') || '{}').id;
      const studentId = student.id;
      // Sort the IDs to ensure consistency
      const sortedIds = [mentorId, studentId].sort();
      const consistentSessionId = `temp_${sortedIds[0]}_${sortedIds[1]}`;
      
      setSelectedStudent(student);
      setShowChat(true);
      setSessionId(consistentSessionId);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedStudent(null);
    setSessionId(null);
  };

  const handleSessionInitiated = (proposal) => {
    console.log('Session initiated:', proposal);
    // In a real implementation, you would send this to the backend
  };

  const handleSessionAccepted = (proposal) => {
    console.log('Session accepted:', proposal);
    // In a real implementation, you would send this to the backend
  };

  const handleJoinSession = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">My Students</h1>
              <p className="text-gray-600 dark:text-slate-400 mt-2">
                View and manage your connected students
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Students List */}
        {!showChat ? (
          <>
            {filteredStudents.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-slate-100 mb-2">
                  No students found
                </h3>
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                  {searchTerm ? 'No students match your search criteria.' : 'You don\'t have any connected students yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Connected on {formatDate(student.connection_date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        <span>{student.session_count || 0} sessions</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        onClick={() => handleOpenChat(student)}
                        className="w-full px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors mb-2"
                      >
                        Chat for Session
                      </button>
                      <button
                        onClick={() => navigate(`/mentor/profile/${student.id}`)}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                Chat with {selectedStudent?.first_name} {selectedStudent?.last_name}
              </h2>
              <button
                onClick={handleCloseChat}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-96">
              <SessionBookingChat
                user={JSON.parse(localStorage.getItem('userData') || '{}')}
                otherUser={selectedStudent}
                userType="mentor"
                sessionId={sessionId}
                onSessionInitiated={handleSessionInitiated}
                onSessionAccepted={handleSessionAccepted}
                onJoinSession={handleJoinSession}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorStudents;