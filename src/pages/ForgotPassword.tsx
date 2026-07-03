import React from 'react';
import { ForgotPassword as ForgotPasswordForm } from '@/components/auth/ForgotPassword';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-gradient-auth flex flex-col relative overflow-hidden">
      <div className="flex justify-end p-4 relative z-10">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4 pb-10 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Logo/Brand */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto shadow-lg animate-pulse-glow">
              <span className="text-white font-extrabold text-2xl">CB</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              ChatBuzz
            </h1>
            <p className="text-white/80 font-medium">Reset your password</p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
