import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Landing: React.FC = () => {
  const { user, profile, companies, loading } = useAuth();

  console.log('=== Landing Component Debug ===');
  console.log('Landing component - auth state:', {
    user: !!user,
    userId: user?.id?.substring(0, 8) + '...',
    profile: !!profile,
    profileRole: profile?.role,
    profileCompanyId: profile?.company_id,
    companiesCount: companies.length,
    loading,
    currentURL: window.location.href
  });

  useEffect(() => {
    console.log('Landing useEffect triggered with:', {
      user: !!user,
      profile: !!profile,
      profileRole: profile?.role,
      companiesCount: companies.length,
      loading
    });
  }, [user, profile, companies, loading]);

  // Show loading while authenticating
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

  // If not logged in, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If no profile yet, redirect to company selection
  if (!profile) {
    return <Navigate to="/company-selection" replace />;
  }

  // For admin users with multiple companies, check if they have a selected company
  if (profile.role === 'admin') {
    if (profile.company_id && companies.length > 0) {
      // Find the selected company and redirect to its dashboard
      const selectedCompany = companies.find(c => c.id === profile.company_id);
      if (selectedCompany) {
        const slug = ('slug' in selectedCompany && selectedCompany.slug) || 
                    selectedCompany.name.toLowerCase().replace(/\s+/g, '-');
        return <Navigate to={`/company/${slug}`} replace />;
      }
    }
    
    // Admin with no selected company - redirect to company selection
    return <Navigate to="/company-selection" replace />;
  }

  // For team members, if they have a company, redirect to it
  if (profile.company_id && companies.length > 0) {
    const company = companies.find(c => c.id === profile.company_id);
    if (company) {
      const slug = ('slug' in company && company.slug) || 
                  company.name.toLowerCase().replace(/\s+/g, '-');
      return <Navigate to={`/company/${slug}`} replace />;
    }
  }

  // Fallback to company selection
  return <Navigate to="/company-selection" replace />;
};

export default Landing;