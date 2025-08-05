import React, { useEffect } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompany?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireCompany = false }) => {
  const { user, profile, companies, selectCompany, loading } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

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

  // Handle company auto-selection from URL parameter
  useEffect(() => {
    const companyParam = searchParams.get('company');
    if (companyParam && companies.length > 0 && profile) {
      console.log('Company parameter found:', companyParam, 'Available companies:', companies.length);
      
      // Find company by matching slug (generated from name)
      const targetCompany = companies.find(company => 
        company.name.toLowerCase().replace(/\s+/g, '-') === companyParam
      );
      
      if (targetCompany) {
        console.log('Found matching company:', targetCompany.name);
        // Only auto-select if user doesn't already have this company selected
        if (profile.company_id !== targetCompany.id) {
          console.log('Auto-selecting company from URL parameter');
          selectCompany(targetCompany.id).then(({ error }) => {
            if (error) {
              console.error('Error auto-selecting company:', error);
              toast({
                title: "Error",
                description: "Failed to select company from link.",
                variant: "destructive"
              });
            } else {
              toast({
                title: "Company selected",
                description: `You're now viewing ${targetCompany.name}.`
              });
            }
          });
        }
        // Remove the company parameter from URL after processing
        searchParams.delete('company');
        setSearchParams(searchParams, { replace: true });
      } else {
        console.log('Company not found for parameter:', companyParam);
        toast({
          title: "Company not found",
          description: "You don't have access to this company.",
          variant: "destructive"
        });
        // Remove invalid parameter
        searchParams.delete('company');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [companies, profile, searchParams, setSearchParams, selectCompany, toast]);

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

  console.log('ProtectedRoute allowing access');
  return <>{children}</>;
};