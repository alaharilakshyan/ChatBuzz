import React from 'react';
import { Navigate } from 'react-router-dom';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle } from 'lucide-react';

const Register = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/chat" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-auth relative overflow-hidden">
      <div className="flex justify-end p-4 relative z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-10 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto shadow-lg animate-pulse-glow">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">ChatBuzz</h1>
            <p className="text-white/80 font-medium">Join the conversation</p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
