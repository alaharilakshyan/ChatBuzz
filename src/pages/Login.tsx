import React from 'react';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle } from 'lucide-react';

const Login = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/chat" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="flex justify-end p-4 relative z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-10 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center mx-auto shadow-md">
              <MessageCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">TalkTime</h1>
            <p className="text-muted-foreground">Connect and chat in real-time</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
