import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompany?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireCompany = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

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

  // Allow access to company slug routes even without profile for auto-selection
  const isCompanySlugRoute = location.pathname.startsWith('/company/');
  
  // If user exists but no profile, they might need to select a company
  if (!profile && !isCompanySlugRoute) {
    return <Navigate to="/company-selection" replace />;
  }

  // Admin users (legacy) can bypass company selection
  if (profile && profile.role === 'admin') {
    return <>{children}</>;
  }

  // For team members, check if they have company access
  if (requireCompany && profile && !profile.company_id) {
    return <Navigate to="/company-selection" replace />;
  }

  return <>{children}</>;
};