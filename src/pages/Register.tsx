import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';

import { MessageCircle, Sparkles, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const Register = () => {
  const { user, loading } = useAuth();
  
  if (!loading && user) return <Navigate to="/chat" replace />;

  return (
    <div className="min-h-screen flex w-full relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Home & Theme Buttons */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-50 flex items-center gap-3">
        <Link to="/" className="p-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
          <Home className="w-5 h-5 text-black dark:text-white" />
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row w-full h-full">
        
        {/* Form Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 z-10 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="w-full max-w-[420px]">
            <div className="text-center space-y-2 mb-10">
              <h1 className="text-4xl font-extrabold tracking-tight text-black dark:text-white">Create Account</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Simplify your workflow and boost your productivity<br/>
                with <span className="font-bold text-black dark:text-white">ChatBuzz</span>. Get started for free.
              </p>
            </div>
            <RegisterForm />
          </div>
        </div>

        {/* Illustration Side */}
        <div className="hidden lg:flex w-1/2 bg-[#F2F6F0] dark:bg-slate-900 p-12 items-center justify-center relative transition-colors duration-300">
          <div className="text-center absolute bottom-24 z-10">
            <h2 className="text-2xl font-bold text-black dark:text-white max-w-sm mx-auto">
              The easiest way to chat, chill, and catch up with friends
            </h2>
          </div>
          {/* Doodle Illustration */}
          <div className="w-full max-w-lg aspect-square flex items-center justify-center -mt-20">
             <img src="/auth-doodle.png" alt="Working doodle" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen dark:[filter:invert(70%)_sepia(100%)_saturate(400%)_hue-rotate(80deg)_brightness(120%)] dark:opacity-90" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
