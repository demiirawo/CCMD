import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import Index from './Index';

const CompanyDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile, companies, selectCompany, loading } = useAuth();
  const { toast } = useToast();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading company dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?returnTo=/company/${slug}`} replace />;
  }

  // For admin users, we bypass company selection entirely
  if (profile?.role === 'admin') {
    console.log('Admin user detected, proceeding to dashboard without company checks');
    
    // If companies are loaded and we have a slug, proceed
    if (companies.length > 0 && slug) {
      const company = companies.find(c => 
        'slug' in c ? c.slug === slug : 
        c.name.toLowerCase().replace(/\s+/g, '-') === slug
      );
      
      if (company) {
        console.log('Company found for admin:', company.name);
        // Ensure the company is selected in the auth context
        if (profile.company_id !== company.id) {
          console.log('Selecting company for admin:', company.id);
          selectCompany(company.id);
        }
        
        return (
          <>
            <Navigation />
            <Index />
          </>
        );
      } else {
        console.log('Company not found, redirecting to selection');
        return <Navigate to="/company-selection" replace />;
      }
    } else if (companies.length === 0 && !loading) {
      console.log('No companies found for admin');
      return <Navigate to="/company-selection" replace />;
    } else {
      // Still loading companies
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading company dashboard...</p>
          </div>
        </div>
      );
    }
  }

  // For non-admin users, continue with existing logic
  if (!loading && !companies.length) {
    return <Navigate to="/company-selection" replace />;
  }

  const company = companies.find(c => 
    'slug' in c ? c.slug === slug : 
    c.name.toLowerCase().replace(/\s+/g, '-') === slug
  );
  
  if (!company) {
    return <Navigate to="/company-selection" replace />;
  }

  // Auto-select company if not already selected
  if (profile?.company_id !== company.id) {
    console.log('Selecting company:', company.id, 'current:', profile?.company_id);
    selectCompany(company.id);
  }

  return (
    <>
      <Navigation />
      <Index />
    </>
  );
};

export default CompanyDashboard;