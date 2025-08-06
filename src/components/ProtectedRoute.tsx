
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompany?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireCompany = false }) => {
  const { user, profile, companies, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', {
    pathname: location.pathname,
    user: !!user,
    profile: !!profile,
    profileRole: profile?.role,
    profileCompanyId: profile?.company_id,
    companiesCount: companies.length,
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
    return <Navigate to="/auth" replace />;
  }

  // Allow access to company slug routes even without profile for auto-selection
  const isCompanySlugRoute = location.pathname.startsWith('/company/');
  
  // If user exists but no profile, they might need to select a company or wait for setup
  if (!profile && !isCompanySlugRoute) {
    console.log('No profile found, redirecting to company selection');
    return <Navigate to="/company-selection" replace />;
  }

  // Admin users (legacy super admin) can bypass company selection requirements
  if (profile && profile.role === 'admin') {
    console.log('Admin user, allowing access');
    return <>{children}</>;
  }

  // For team members without companies, redirect to company selection
  if (profile && profile.role === 'user' && companies.length === 0) {
    console.log('Team member with no companies, redirecting to company selection');
    return <Navigate to="/company-selection" replace />;
  }

  // For team members with companies but no active company selection
  if (requireCompany && profile && profile.role === 'user' && !profile.company_id && companies.length > 0) {
    console.log('Team member needs to select company');
    return <Navigate to="/company-selection" replace />;
  }

  console.log('Access granted to protected route');
  return <>{children}</>;
};
