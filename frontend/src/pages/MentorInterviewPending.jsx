import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Mail, Phone, Video } from "lucide-react";

export default function MentorInterviewPending() {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 35,
    seconds: 22
  });
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Function to join the interview session
  const joinInterview = () => {
    // TODO: Implement interview joining logic
    console.log('Join interview');
    // For now, just show an alert
    alert('Interview functionality has been removed. You will implement your own interview call feature.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Interview Scheduled
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-400">
            Thank you for completing your mentor application. Your interview has been scheduled.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">
              Interview Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-primary mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">Date & Time</h3>
              </div>
              <p className="text-gray-700 dark:text-slate-300">
                Friday, November 15, 2025
              </p>
              <p className="text-gray-700 dark:text-slate-300">
                2:30 PM - 3:30 PM (60 minutes)
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Video className="w-5 h-5 text-primary mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">Meeting Link</h3>
              </div>
              <p className="text-gray-700 dark:text-slate-300 break-all">
                https://meet.google.com/abc-defg-hij
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Mail className="w-5 h-5 text-primary mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">Confirmation</h3>
              </div>
              <p className="text-gray-700 dark:text-slate-300">
                A confirmation email has been sent to your email address
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Phone className="w-5 h-5 text-primary mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-slate-100">Contact</h3>
              </div>
              <p className="text-gray-700 dark:text-slate-300">
                If you need to reschedule, contact support@blocklearn.com
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">What to Expect</h3>
            <ul className="list-disc list-inside text-blue-800 dark:text-blue-400 space-y-1">
              <li>Introduction to BlockLearn platform and teaching methodology</li>
              <li>Demonstration of your teaching skills in one of your listed skills</li>
              <li>Discussion of your availability and preferred teaching methods</li>
              <li>Q&A session about the platform and community</li>
            </ul>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Time Until Your Interview
            </h3>
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {timeLeft.days}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Days</span>
                </div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {timeLeft.hours}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Hours</span>
                </div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {timeLeft.minutes}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Minutes</span>
                </div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {timeLeft.seconds}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">Seconds</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={joinInterview}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors mr-4"
            >
              Join Interview Session
            </button>
            <button
              onClick={() => navigate("/mentor/dashboard")}
              className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}