import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const RootRedirect: React.FC = () => {
  const { user, profile, companies, loading } = useAuth();
  
  console.log('RootRedirect auth state:', { user: !!user, profile: !!profile, companies: companies.length, loading });
  
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
  
  if (user && profile && profile.company_id && companies.length > 0) {
    const currentCompany = companies.find(c => c.id === profile.company_id);
    if (currentCompany) {
      const slug = ('slug' in currentCompany && currentCompany.slug) || 
                 currentCompany.name.toLowerCase().replace(/\s+/g, '-');
      console.log('Redirecting to company dashboard:', slug);
      return <Navigate to={`/company/${slug}`} replace />;
    }
  }
  
  console.log('Redirecting to company selection');
  return <Navigate to="/company-selection" replace />;
};
