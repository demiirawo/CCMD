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

  console.log('ProtectedRoute:', { 
    pathname: location.pathname, 
    user: !!user, 
    profile: !!profile, 
    loading, 
    requireCompany,
    isCompanySlugRoute: location.pathname.startsWith('/company/')
  });

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
    console.log('No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // Allow access to company slug routes even without profile for auto-selection
  const isCompanySlugRoute = location.pathname.startsWith('/company/');
  
  // If user exists but no profile, they might need to select a company
  if (!profile && !isCompanySlugRoute) {
    console.log('No profile and not company slug route, redirecting to /company-selection');
    return <Navigate to="/company-selection" replace />;
  }

  // Admin users (legacy) can bypass company selection
  if (profile && profile.role === 'admin') {
    console.log('Admin user, allowing access');
    return <>{children}</>;
  }

  // For team members, check if they have company access
  if (requireCompany && profile && !profile.company_id) {
    console.log('Require company but no company_id, redirecting to /company-selection');
    return <Navigate to="/company-selection" replace />;
  }

  console.log('ProtectedRoute allowing access - final fallback');
  return <>{children}</>;
};