import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { Calendar, Mail, Video } from "lucide-react";

export default function MentorInterviewPending() {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch interview details when component mounts
  useEffect(() => {
    fetchInterviewDetails();
  }, []);

  const fetchInterviewDetails = async () => {
    try {
      const response = await api.get("/api/auth/my-interview");
      if (response.data.success && response.data.data) {
        setInterview(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching interview details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to join the interview session
  const joinInterview = () => {
    if (interview && interview.meetingLink) {
      // Redirect mentor directly to the mentor meeting link
      window.location.href = interview.meetingLink;
    } else {
      // Fallback to the format you provided
      alert("Redirecting to interview meeting...");
      window.location.href = "https://meet.jit.si/moderated/4754bc865a90cabf3bfc32a4de2b5dca678ab4cb992dba03b38a750e9354a408";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="w-32 h-32 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl px-4 py-12 mx-auto sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-slate-100">
            Interview Scheduled
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-400">
            Thank you for completing your mentor application. Your interview has been scheduled.
          </p>
        </div>

        <div className="p-6 bg-white border border-gray-200 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700 sm:p-8">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-slate-100">
              Interview Details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
            <div className="p-6 rounded-lg bg-gray-50 dark:bg-slate-700/50">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">Date & Time</h3>
              </div>
              {interview ? (
                <>
                  <p className="text-gray-700 dark:text-slate-300">
                    {new Date(interview.scheduledAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 dark:text-slate-300">
                    {new Date(interview.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} ({interview.durationMinutes} minutes)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-slate-300">
                    Friday, November 15, 2025
                  </p>
                  <p className="text-gray-700 dark:text-slate-300">
                    2:30 PM - 3:30 PM (60 minutes)
                  </p>
                </>
              )}
            </div>

            <div className="p-6 rounded-lg bg-gray-50 dark:bg-slate-700/50">
              <div className="flex items-center mb-4">
                <Video className="w-5 h-5 mr-2 text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">Meeting Link</h3>
              </div>
              {interview && interview.meetingLink ? (
                <p className="text-gray-700 break-all dark:text-slate-300">
                  {interview.meetingLink}
                </p>
              ) : (
                <p className="text-gray-700 break-all dark:text-slate-300">
                  https://meet.google.com/abc-defg-hij
                </p>
              )}
            </div>

            <div className="p-6 rounded-lg bg-gray-50 dark:bg-slate-700/50">
              <div className="flex items-center mb-4">
                <Mail className="w-5 h-5 mr-2 text-primary" />
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">Confirmation</h3>
              </div>
              <p className="text-gray-700 dark:text-slate-300">
                A confirmation email has been sent to your email address
              </p>
            </div>
          </div>

          <div className="p-6 mb-8 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">What to Expect</h3>
            <ul className="space-y-1 text-blue-800 list-disc list-inside dark:text-blue-400">
              <li>Introduction to BlockLearn platform and teaching methodology</li>
              <li>Demonstration of your teaching skills in one of your listed skills</li>
              <li>Discussion of your availability and preferred teaching methods</li>
              <li>Q&A session about the platform and community</li>
            </ul>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={joinInterview}
              className="px-6 py-3 mr-4 font-medium text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
            >
              Join Interview Session
            </button>
            <button
              onClick={() => navigate("/mentor/dashboard")}
              className="px-6 py-3 font-medium text-gray-800 transition-colors bg-gray-200 rounded-lg dark:bg-slate-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}