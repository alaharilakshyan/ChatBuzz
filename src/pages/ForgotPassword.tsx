import React from 'react';
import { ForgotPassword as ForgotPasswordForm } from '@/components/auth/ForgotPassword';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen flex w-full relative overflow-hidden bg-[url('/login-bg.jpg')] bg-cover bg-center bg-no-repeat">
      {/* Decorative overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 z-10 w-full max-w-7xl mx-auto gap-12">
        <motion.div 
          className="w-full max-w-[420px] shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 rounded-3xl bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center justify-center mx-auto shadow-xl">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">ChatBuzz</h1>
          </div>
          <ForgotPasswordForm />
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
