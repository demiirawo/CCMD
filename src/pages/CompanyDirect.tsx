import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CompanyDirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile, selectCompany, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const handleCompanyAccess = async () => {
      if (authLoading) return;
      
      // Redirect to auth if not logged in
      if (!user) {
        navigate('/auth', { 
          state: { 
            returnUrl: `/company/${slug}`,
            message: 'Please sign in to access this company dashboard'
          }
        });
        return;
      }

      if (!slug) {
        setError('Invalid company URL');
        setLoading(false);
        return;
      }

      try {
        // Find company by slug
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('slug', slug)
          .single();

        if (companyError || !companyData) {
          setError('Company not found');
          setLoading(false);
          return;
        }

        setCompany(companyData);

        // Check if user has access to this company
        if (profile?.role === 'admin') {
          // Admins can access any company
          await selectCompany(companyData.id);
          navigate('/');
          return;
        }

        // For non-admin users, check if they have access to this company
        const { data: userCompanies, error: accessError } = await supabase
          .from('user_companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('company_id', companyData.id);

        if (accessError || !userCompanies || userCompanies.length === 0) {
          setError('You do not have access to this company');
          setLoading(false);
          return;
        }

        // User has access, select the company and redirect to dashboard
        await selectCompany(companyData.id);
        navigate('/');

      } catch (err) {
        console.error('Error accessing company:', err);
        setError('Failed to access company');
        setLoading(false);
      }
    };

    handleCompanyAccess();
  }, [slug, user, profile, authLoading, selectCompany, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Building2 className="h-5 w-5 animate-pulse" />
              <p>Loading company...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            {company && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{company.name}</p>
                <p className="text-sm text-muted-foreground">
                  Company URL: /company/{company.slug}
                </p>
              </div>
            )}
            <div className="flex flex-col space-y-2">
              <Button onClick={() => navigate('/company-selection')}>
                View Available Companies
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Sign In with Different Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};