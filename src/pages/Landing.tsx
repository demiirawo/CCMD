import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Landing: React.FC = () => {
  const { user, profile, companies, loading } = useAuth();

  console.log('=== Landing Component Rendering ===');
  console.log('Current URL:', window.location.href);
  console.log('Auth state:', {
    user: !!user,
    profile: !!profile,
    profileRole: profile?.role,
    profileCompanyId: profile?.company_id,
    companiesCount: companies.length,
    loading
  });

  // If still loading, show loading state
  if (loading) {
    console.log('Landing: Still loading, showing spinner');
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
    console.log('Landing: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // If no profile, redirect to company selection
  if (!profile) {
    console.log('Landing: No profile, redirecting to company selection');
    return <Navigate to="/company-selection" replace />;
  }

  // If we have profile and companies, redirect to appropriate company
  if (companies.length > 0) {
    console.log('Landing: Have companies, determining redirect...');
    
    // For admin users, use their selected company or default to first company
    if (profile.role === 'admin') {
      let targetCompany;
      
      if (profile.company_id) {
        targetCompany = companies.find(c => c.id === profile.company_id);
        console.log('Landing: Admin with selected company:', targetCompany?.name);
      }
      
      // If no selected company or selected company not found, use first available
      if (!targetCompany) {
        targetCompany = companies[0];
        console.log('Landing: Admin defaulting to first company:', targetCompany?.name);
      }
      
      if (targetCompany) {
        const slug = ('slug' in targetCompany && targetCompany.slug) || 
                    targetCompany.name.toLowerCase().replace(/\s+/g, '-');
        console.log('Landing: Redirecting admin to:', `/company/${slug}`);
        return <Navigate to={`/company/${slug}`} replace />;
      }
    }
    
    // For team members, use their assigned company
    if (profile.company_id) {
      const company = companies.find(c => c.id === profile.company_id);
      if (company) {
        const slug = ('slug' in company && company.slug) || 
                    company.name.toLowerCase().replace(/\s+/g, '-');
        console.log('Landing: Redirecting team member to:', `/company/${slug}`);
        return <Navigate to={`/company/${slug}`} replace />;
      }
    }
  }

  // Fallback to company selection
  console.log('Landing: Fallback - redirecting to company selection');
  return <Navigate to="/company-selection" replace />;
};

export default Landing;