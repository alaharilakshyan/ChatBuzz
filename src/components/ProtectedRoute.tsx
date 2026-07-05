
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUser } from '@clerk/clerk-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  // Wait for Clerk SDK to initialize before making redirect decisions.
  if (!clerkLoaded) return <LoadingSpinner />;

  // If we have either a local `user` (from our backend) or a Clerk user
  // session, allow access. This prevents a redirect race where Clerk
  // redirects to /chat immediately after sign-in but our backend
  // profile hasn't been fetched yet.
  if (!user && !clerkUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
