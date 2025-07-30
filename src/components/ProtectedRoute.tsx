import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompany?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireCompany = false }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user exists but no profile, they might need to select a company
  if (!profile) {
    return <Navigate to="/company-selection" replace />;
  }

  // Admin users (legacy) can bypass company selection
  if (profile.role === 'admin') {
    return <>{children}</>;
  }

  // For team members, check if they have company access
  if (requireCompany && !profile.company_id) {
    return <Navigate to="/company-selection" replace />;
  }

  return <>{children}</>;
};