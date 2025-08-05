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

  useEffect(() => {
    if (!slug || !user || loading || !companies.length) {
      return;
    }

    // Find the company by slug
    const company = companies.find(c => 
      ('slug' in c && c.slug === slug) || 
      c.name.toLowerCase().replace(/\s+/g, '-') === slug
    );
    
    if (!company) {
      toast({
        title: "Company not found",
        description: "You don't have access to this company.",
        variant: "destructive",
      });
      return;
    }

    // Automatically select the company if it's not already selected
    if (profile?.company_id !== company.id) {
      selectCompany(company.id);
    }
  }, [slug, user, companies, profile, selectCompany, loading, toast]);

  // Show loading while we're getting initial data
  if (loading || !user || !companies.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to={`/auth?returnTo=/company/${slug}`} replace />;
  }

  // Find the company
  const company = companies.find(c => 
    ('slug' in c && c.slug === slug) || 
    c.name.toLowerCase().replace(/\s+/g, '-') === slug
  );
  
  // If company not found, redirect to company selection
  if (!company) {
    return <Navigate to="/company-selection" replace />;
  }

  // Render the dashboard directly
  return (
    <>
      <Navigation />
      <Index />
    </>
  );
};

export default CompanyDashboard;