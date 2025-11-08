import { Button } from "@/components/ui/button";
import SkillCard from "@/components/SkillCard";
import CategoryCard from "@/components/CategoryCard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  Palette,
  Languages,
  Briefcase,
  Sparkles,
  Users,
  ArrowRight,
  BookOpen,
  Camera,
  Music,
  Calculator,
  Mic,
  Heart,
  Zap
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/prelogin');
  };

  const handleBrowseSkills = () => {
    navigate('/skills');
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="backdrop-blur-md bg-white/10 dark:bg-slate-900/10 border-b border-white/20 dark:border-slate-700/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  BlockLearn
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLogin}
                  className="text-gray-600 dark:text-slate-300 hover:text-primary transition-colors"
                >
                  Login
                </button>
                <Button onClick={handleGetStarted} className="bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-slate-100 mb-6">
                Learn Together,
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  Grow Together
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                Connect with expert mentors, share your knowledge, and build blockchain-verified certificates in our peer-to-peer learning community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
              >
                Start Learning Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleBrowseSkills}
                className="text-lg px-8 py-4"
              >
                Browse Skills
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl p-8">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">Find Mentors</h3>
                <p className="text-gray-600 dark:text-slate-400">Connect with experienced mentors in your field of interest</p>
              </div>
              <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl p-8">
                <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">Book Sessions</h3>
                <p className="text-gray-600 dark:text-slate-400">Schedule personalized 1-on-1 learning sessions</p>
              </div>
              <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-2xl p-8">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">Earn Certificates</h3>
                <p className="text-gray-600 dark:text-slate-400">Get blockchain-verified certificates for your achievements</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;