import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { DataIsolationWrapper } from '@/components/DataIsolationWrapper';
import Index from './Index';

const CompanyDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile, companies, selectCompany, loading } = useAuth();
  const { selectCompanyWithSession, isSessionValid, sessionChecking } = useSessionManager();
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

    // Only select company if it's different AND we have a stable profile
    // This prevents rapid switching when profile is being updated
    if (profile?.company_id !== company.id && profile?.user_id === user.id) {
      console.log('Auto-selecting company with session management:', company.name, 'for user:', user.id);
      
      // Use session manager to handle company selection
      selectCompanyWithSession(company.id)
        .then((success) => {
          if (success) {
            selectCompany(company.id);
          } else {
            toast({
              title: "Session Error",
              description: "Cannot access this company due to an active session elsewhere.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error('Error in session-managed company selection:', error);
          toast({
            title: "Error",
            description: "Failed to access company.",
            variant: "destructive",
          });
        });
    }
  }, [slug, user?.id, companies, profile?.company_id, profile?.user_id, selectCompany, loading, toast]);

  // Show loading while we're getting initial data or validating session
  if (loading || sessionChecking || !user || !companies.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{sessionChecking ? 'Validating session...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Redirect if session is invalid
  if (!isSessionValid) {
    return <Navigate to="/company-selection" replace />;
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

  // Render the dashboard with data isolation wrapper
  return (
    <DataIsolationWrapper enableLogging={true}>
      <Navigation />
      <Index />
    </DataIsolationWrapper>
  );
};

export default CompanyDashboard;