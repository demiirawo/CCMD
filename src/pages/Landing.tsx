import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

console.log('=== Landing.tsx file loaded ===');

const Landing: React.FC = () => {
  console.log('=== Landing component function called ===');
  
  const { user, profile, companies, loading } = useAuth();

  console.log('Landing auth state:', {
    user: !!user,
    profile: !!profile,
    profileRole: profile?.role,
    profileCompanyId: profile?.company_id,
    companiesCount: companies.length,
    loading
  });

  // Simple test render first
  if (loading) {
    console.log('Landing: showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If we have an admin user with companies, redirect to OICE
  if (user && profile && user.email === 'demi.irawo@care-cuddle.co.uk' && companies.length > 0) {
    console.log('Landing: Admin user with companies, redirecting to /company/oice');
    return <Navigate to="/company/oice" replace />;
  }

  // For now, just redirect to company selection
  console.log('Landing: Fallback redirect to company selection');
  return <Navigate to="/company-selection" replace />;
};

export default Landing;