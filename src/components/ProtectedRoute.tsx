
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
  const { isLoaded: clerkLoaded } = useUser();

  // Wait for Clerk SDK to initialize and for our profile loading
  // to finish before making redirect decisions. This avoids
  // redirect loops / bouncing during sign-in flows on slow networks.
  if (!clerkLoaded || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
