import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowRight, MessageCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-black dark:text-white overflow-hidden flex flex-col transition-colors duration-300">
      
      {/* Top Bar (No logo) */}
      <nav className="w-full max-w-7xl mx-auto px-8 py-6 flex items-center justify-between z-50 bg-white dark:bg-slate-950 transition-colors duration-300">
        <div className="flex items-center gap-2 text-black dark:text-white">
          <MessageCircle className="w-8 h-8 text-[#9AC68A] dark:text-[#4ADE80]" />
          <span className="font-bold text-xl tracking-tight">ChatBuzz</span>
        </div>
        <div className="sm:hidden"></div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!user && (
            <Link to="/login" className="text-[15px] font-medium text-black dark:text-white hover:underline">
              Log in
            </Link>
          )}
          <Link 
            to={user ? "/chat" : "/register"} 
            className="text-[15px] font-semibold bg-black dark:bg-[#4ADE80] text-white dark:text-black px-6 py-2.5 rounded-full hover:bg-black/90 dark:hover:bg-[#22C55E] transition-colors"
          >
            {user ? "Go to chat" : "Sign up"}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row w-full h-full relative">
        
        {/* Left Side: Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 pt-12 pb-24 z-10 bg-white dark:bg-slate-950 transition-colors duration-300">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-black dark:text-white mb-6">
              Connect effortlessly. <br/>
              <span className="text-[#9AC68A] dark:text-[#4ADE80] font-serif italic font-medium">Chat instantly.</span>
            </h1>
            
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-md leading-relaxed">
              Simplify your workflow and boost your productivity with a clean, fast, and organized chat experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link 
                to={user ? "/chat" : "/register"}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black dark:bg-[#4ADE80] text-white dark:text-black font-semibold px-8 h-14 rounded-full hover:bg-black/90 dark:hover:bg-[#22C55E] transition-colors text-[16px]"
              >
                {user ? "Open Application" : "Get Started"}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div>
                  <div className="w-10 h-10 rounded-full bg-[#F2F6F0] dark:bg-slate-900 flex items-center justify-center mb-4 transition-colors duration-300">
                    <MessageCircle className="w-5 h-5 text-[#9AC68A] dark:text-[#4ADE80]" />
                  </div>
                  <h3 className="font-bold text-black dark:text-white mb-2">Real-time Sync</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Messages delivered instantly across all your devices.</p>
               </div>
               <div>
                  <div className="w-10 h-10 rounded-full bg-[#F2F6F0] dark:bg-slate-900 flex items-center justify-center mb-4 transition-colors duration-300">
                    <Shield className="w-5 h-5 text-[#9AC68A] dark:text-[#4ADE80]" />
                  </div>
                  <h3 className="font-bold text-black dark:text-white mb-2">Private & Secure</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your conversations stay between you and your friends.</p>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Visuals */}
        <div className="hidden lg:flex w-1/2 bg-[#F2F6F0] dark:bg-slate-900 relative overflow-hidden items-center justify-center transition-colors duration-300">
          {/* Using the same doodle style for consistency */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.7, delay: 0.2 }}
             className="w-full max-w-[600px] aspect-square flex items-center justify-center"
          >
             <img src="/hero-image.jpg" alt="Chat illustration" className="w-full max-h-[85%] object-cover rounded-[32px] shadow-2xl border border-white/40 dark:border-slate-800/40" />
          </motion.div>
          
          {/* Decorative bubble */}
          <div className="absolute top-[30%] right-[15%] bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl rounded-br-none animate-bounce transition-colors duration-300" style={{ animationDuration: '3s' }}>
             <p className="text-sm font-bold text-black dark:text-white">Hey! Ready to chat?</p>
          </div>
          <div className="absolute bottom-[35%] left-[15%] bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl rounded-bl-none animate-bounce transition-colors duration-300" style={{ animationDuration: '4s', animationDelay: '1s' }}>
             <p className="text-sm font-bold text-[#9AC68A] dark:text-[#4ADE80]">Let's do this! ✨</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
