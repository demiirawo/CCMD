
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, CheckCircle } from "lucide-react";

export const CompanySelector = () => {
  const { user, userCompanies, selectCompany, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (user?.id && userCompanies.length >= 0) {
      setLoading(false);
    }
  }, [user?.id, userCompanies]);

  // Auto-select company if slug is provided
  useEffect(() => {
    console.log('CompanySelector auto-select effect:', { companySlug, userCompaniesLength: userCompanies.length, loading });
    
    if (companySlug && userCompanies.length > 0 && !loading) {
      console.log('Searching for company with slug:', companySlug);
      console.log('Available companies:', userCompanies.map(uc => ({ 
        id: uc.company_id, 
        name: uc.company_name,
        slug: uc.company_slug || uc.company_name.toLowerCase().replace(/\s+/g, '-')
      })));
      
      const targetCompany = userCompanies.find(uc => 
        uc.company_id === companySlug || 
        uc.company_slug === companySlug ||
        uc.company_name.toLowerCase().replace(/\s+/g, '-') === companySlug
      );
      
      console.log('Target company found:', targetCompany);
      
      if (targetCompany) {
        console.log('Auto-selecting company:', targetCompany.company_name);
        handleSelectCompany(targetCompany.company_id);
      } else {
        console.log('Company not found, redirecting to company selection');
        toast({
          title: "Company not found",
          description: "You don't have access to this company or it doesn't exist.",
          variant: "destructive"
        });
        navigate('/company-selection');
      }
    }
  }, [companySlug, userCompanies, loading]);

  const handleSelectCompany = async (companyId: string) => {
    setSelecting(true);
    try {
      const { error } = await selectCompany(companyId);

      if (error) throw error;

      const selectedCompany = userCompanies.find(uc => uc.company_id === companyId);
      if (!selectedCompany) throw new Error('Company not found');

      // Force refresh the profile in auth context to get updated active_company_id
      refreshProfile();

      toast({
        title: "Company selected",
        description: `You're now viewing ${selectedCompany.company_name}.`
      });

      // Navigate after a short delay to ensure auth context has updated
      setTimeout(() => {
        navigate('/');
      }, 200);
    } catch (error) {
      console.error('Error selecting company:', error);
      toast({
        title: "Error",
        description: "Failed to select company.",
        variant: "destructive"
      });
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your companies...</p>
        </div>
      </div>
    );
  }

  if (userCompanies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">No Companies Found</h1>
          <p className="text-muted-foreground mb-4">
            Your email address ({user?.email}) is not associated with any companies yet.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Please contact your administrator to be added to a company team.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => refreshProfile()}
              variant="outline"
              disabled={selecting}
            >
              {selecting ? 'Checking...' : 'Refresh'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => supabase.auth.signOut()}
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (userCompanies.length === 1) {
    // Auto-select if only one company and redirect
    const singleCompany = userCompanies[0];
    handleSelectCompany(singleCompany.company_id);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
          <p className="text-muted-foreground">Setting up your access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Select Your Company</h1>
            <p className="text-muted-foreground">
              You have access to multiple companies. Please select which company you'd like to view.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userCompanies.map((userCompany) => (
              <Card 
                key={userCompany.team_member_id}
                className="cursor-pointer transition-all hover:shadow-lg hover:bg-muted/50"
                onClick={() => handleSelectCompany(userCompany.company_id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {userCompany.company_logo_url ? (
                        <img 
                          src={userCompany.company_logo_url} 
                          alt={`${userCompany.company_name} logo`}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ 
                            backgroundColor: userCompany.company_theme_color || '#3b82f6' 
                          }}
                        >
                          {userCompany.company_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{userCompany.company_name}</CardTitle>
                        <CardDescription>
                          {userCompany.permission === 'company_admin' 
                            ? 'Company Admin' 
                            : userCompany.permission === 'edit'
                            ? 'Editor'
                            : 'Viewer'
                          }
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Logged in as {userCompany.display_name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button 
              variant="outline" 
              onClick={() => supabase.auth.signOut()}
              disabled={selecting}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
