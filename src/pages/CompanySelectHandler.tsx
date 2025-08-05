import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export const CompanySelectHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, companies, selectCompany, loading } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCompanySelection = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (loading) return; // Wait for auth to load

      const companySlug = searchParams.get('company');
      
      if (!companySlug) {
        toast({
          title: 'Error',
          description: 'No company specified in the link.',
          variant: 'destructive'
        });
        navigate('/company-selection');
        return;
      }

      if (companies.length === 0) {
        toast({
          title: 'Error',
          description: 'You don\'t have access to any companies.',
          variant: 'destructive'
        });
        navigate('/company-selection');
        return;
      }

      // Find company by matching slug (generated from name)
      const targetCompany = companies.find(company => 
        company.name.toLowerCase().replace(/\s+/g, '-') === companySlug
      );

      if (!targetCompany) {
        toast({
          title: 'Company not found',
          description: 'You don\'t have access to this company.',
          variant: 'destructive'
        });
        navigate('/company-selection');
        return;
      }

      try {
        const { error } = await selectCompany(targetCompany.id);
        
        if (error) {
          console.error('Error selecting company:', error);
          toast({
            title: 'Error',
            description: 'Failed to select company from link.',
            variant: 'destructive'
          });
          navigate('/company-selection');
        } else {
          toast({
            title: 'Company selected',
            description: `You're now viewing ${targetCompany.name}.`
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error selecting company:', error);
        toast({
          title: 'Error',
          description: 'Failed to select company from link.',
          variant: 'destructive'
        });
        navigate('/company-selection');
      } finally {
        setProcessing(false);
      }
    };

    handleCompanySelection();
  }, [user, companies, loading, searchParams, selectCompany, navigate, toast]);

  if (loading || processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
            <CardTitle>Selecting Company</CardTitle>
            <CardDescription>
              Please wait while we process your company selection...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};