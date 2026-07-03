import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      navigate('/login');
    }

    setLoading(false);
  };

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
            <p className="text-white/80 font-medium">Create a new password</p>
          </div>

          <Card className="w-full border-border/60 shadow-elegant backdrop-blur-xl bg-card/95 rounded-2xl">
            <CardHeader>
              <CardTitle>New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
