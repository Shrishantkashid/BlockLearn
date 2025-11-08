import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Use the api service instead of axios directly
import { BookOpen, Clock, Award, Calendar, CheckCircle, AlertCircle } from "lucide-react";

function MentorOnboarding() {
  const [step, setStep] = useState(1);
  const [academicDetails, setAcademicDetails] = useState({
    degree: "",
    institution: "",
    year: "",
    major: ""
  });
  const [teachingExperience, setTeachingExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  useEffect(() => {
    // Redirect if user is not a mentor
    if (userData && userData.userType !== "mentor") {
      navigate("/dashboard");
    }
    // If mentor is already approved, redirect to mentor dashboard
    else if (userData && userData.mentorApproved === true) {
      navigate("/mentor/dashboard");
    }
  }, [userData, navigate]);

  const handleAcademicDetailsChange = (e) => {
    const { name, value } = e.target;
    setAcademicDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvailabilityChange = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    // Validate required fields
    if (!academicDetails.degree || !academicDetails.institution || !academicDetails.major || !academicDetails.year) {
      setError("Please fill in all academic details.");
      setIsLoading(false);
      return;
    }

    if (!teachingExperience) {
      setError("Please describe your teaching experience.");
      setIsLoading(false);
      return;
    }

    if (!skills) {
      setError("Please list your skills.");
      setIsLoading(false);
      return;
    }

    // Prepare application data
    const applicationData = {
      academicDetails,
      teachingExperience,
      skills,
      availability
    };

    try {
      const token = localStorage.getItem("token");
      const response = await api.post("/api/auth/mentor-application", applicationData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Show success message
        setMessage("✅ Application submitted successfully! An interview has been scheduled. Please check your email for details.");
        
        // After a short delay, redirect to the mentor dashboard
        // The mentor dashboard will handle checking for interview details
        setTimeout(() => {
          navigate("/mentor/dashboard");
        }, 3000);
      } else {
        setError(response.data.message || "Failed to submit application. Please try again.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setError("Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            Mentor Onboarding
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Complete your profile to start mentoring students
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-700 -z-10"></div>
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= num
                      ? "bg-primary text-white"
                      : "bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 text-gray-400"
                  }`}
                >
                  {step > num ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="font-medium">{num}</span>
                  )}
                </div>
                <span className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                  {num === 1 && "Academic"}
                  {num === 2 && "Experience"}
                  {num === 3 && "Skills"}
                  {num === 4 && "Availability"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-slate-700">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Academic Details */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                  Academic Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="degree" className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                      Degree
                    </label>
                    <input
                      type="text"
                      id="degree"
                      name="degree"
                      value={academicDetails.degree}
                      onChange={handleAcademicDetailsChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., Bachelor of Science"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="institution" className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                      Institution
                    </label>
                    <input
                      type="text"
                      id="institution"
                      name="institution"
                      value={academicDetails.institution}
                      onChange={handleAcademicDetailsChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., University Name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="major" className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                      Major
                    </label>
                    <input
                      type="text"
                      id="major"
                      name="major"
                      value={academicDetails.major}
                      onChange={handleAcademicDetailsChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                      Year of Graduation
                    </label>
                    <input
                      type="number"
                      id="year"
                      name="year"
                      value={academicDetails.year}
                      onChange={handleAcademicDetailsChange}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., 2023"
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div></div> {/* Empty div for spacing */}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Next: Experience
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Teaching Experience */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                  Teaching Experience
                </h2>
                
                <div>
                  <label htmlFor="teachingExperience" className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                    Describe your teaching or mentoring experience
                  </label>
                  <textarea
                    id="teachingExperience"
                    value={teachingExperience}
                    onChange={(e) => setTeachingExperience(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Tell us about your experience teaching, tutoring, or mentoring others..."
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Next: Skills
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Skills */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                  Skills & Expertise
                </h2>
                
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                    List your areas of expertise and skills you can teach
                  </label>
                  <textarea
                    id="skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., JavaScript, React, Python, Data Structures, Machine Learning, etc."
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Next: Availability
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Availability */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                  Availability
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-slate-100 mb-4">
                    Select the days you're available for mentoring sessions
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.keys(availability).map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleAvailabilityChange(day)}
                        className={`p-3 rounded-lg border transition-colors ${
                          availability[day]
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-600"
                        }`}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-100 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className="mt-6 p-4 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">{message}</span>
              </div>
              <div className="mt-3 text-sm">
                <p>Once your interview is scheduled, you'll receive an email with your interview code.</p>
                <p className="mt-1">
                  You can join your interview session by entering the code at: 
                  <a href="/interview/code-entry" className="text-primary hover:underline ml-1">Interview Code Entry</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MentorOnboarding;