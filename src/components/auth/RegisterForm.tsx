import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Lock } from 'lucide-react';

export const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      toast({ title: 'Account created!', description: "Welcome to ChatBuzz." });
      navigate('/chat');
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Please try again with different credentials.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto rounded-2xl border-border/60 shadow-elegant backdrop-blur-xl bg-card/95 hover:shadow-brand transition-all duration-300">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-brand bg-clip-text text-transparent">Create account</CardTitle>
        <CardDescription className="text-center">Get started with ChatBuzz in seconds</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-10 h-11 rounded-xl"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-gradient-brand text-white font-semibold shadow-brand hover:opacity-95 transition-all"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center pt-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
