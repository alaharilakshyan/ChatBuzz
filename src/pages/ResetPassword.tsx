import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageCircle, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { motion } from 'framer-motion';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim() || !confirmPassword.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    setLoading(true);

    // TODO: Implement Clerk reset password logic here if using custom flow
    toast({
      title: "Notice",
      description: "Password reset is handled by Clerk via the main login screen.",
    });
    navigate('/login');

    setLoading(false);
  };

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

          <Card className="w-full max-w-[420px] mx-auto rounded-[24px] border-0 shadow-2xl bg-white/95 dark:bg-[#1A1A1A] overflow-hidden backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4 pt-6">
              <CardTitle className="text-2xl font-bold text-center text-zinc-900 dark:text-white">New Password</CardTitle>
              <CardDescription className="text-center text-zinc-500 dark:text-zinc-400 text-[15px]">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="px-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 font-semibold text-[15px]">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-12 rounded-xl bg-zinc-50 dark:bg-[#27272A] border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500 text-[15px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-zinc-700 dark:text-zinc-300 font-semibold text-[15px]">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="h-12 rounded-xl bg-zinc-50 dark:bg-[#27272A] border-zinc-200 dark:border-[#27272A] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500 text-[15px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3 px-8 pb-8 pt-4">
                <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[16px] border-0 hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
