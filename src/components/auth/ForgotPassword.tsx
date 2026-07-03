import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEmailSent(true);
      toast({
        title: "Success",
        description: "Password reset link sent to your email",
      });
    }

    setLoading(false);
  };

  if (emailSent) {
    return (
      <Card className="w-full border-border/60 shadow-elegant backdrop-blur-xl bg-card/95 rounded-2xl hover:shadow-brand transition-all duration-300">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent a password reset link to {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please check your email and click the link to reset your password. The link will expire in 1 hour.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" asChild className="w-full">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border/60 shadow-elegant backdrop-blur-xl bg-card/95 rounded-2xl hover:shadow-brand transition-all duration-300">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a reset link
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
