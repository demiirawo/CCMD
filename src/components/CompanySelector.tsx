import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, CheckCircle } from "lucide-react";

interface UserCompany {
  id: string;
  company_id: string;
  team_member_id: string;
  is_active: boolean;
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
    theme_color: string | null;
  };
  team_members: {
    id: string;
    name: string;
    permission: 'read' | 'edit' | 'company_admin';
  };
}

export const CompanySelector = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { companySlug } = useParams();
  const navigate = useNavigate();
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    fetchUserCompanies();
  }, [user?.id]);

  // Auto-select company if slug is provided
  useEffect(() => {
    console.log('CompanySelector auto-select effect:', { companySlug, userCompaniesLength: userCompanies.length, loading });
    
    if (companySlug && userCompanies.length > 0 && !loading) {
      console.log('Searching for company with slug:', companySlug);
      console.log('Available companies:', userCompanies.map(uc => ({ 
        id: uc.companies.id, 
        name: uc.companies.name,
        slug: uc.companies.name.toLowerCase().replace(/\s+/g, '-')
      })));
      
      const targetCompany = userCompanies.find(uc => 
        uc.companies.id === companySlug || 
        uc.companies.name.toLowerCase().replace(/\s+/g, '-') === companySlug
      );
      
      console.log('Target company found:', targetCompany);
      
      if (targetCompany) {
        console.log('Auto-selecting company:', targetCompany.companies.name);
        handleSelectCompany(
          targetCompany.id, 
          targetCompany.company_id, 
          targetCompany.team_member_id
        );
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

  const fetchUserCompanies = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select(`
          id,
          company_id,
          team_member_id,
          is_active,
          companies:company_id (
            id,
            name,
            logo_url,
            theme_color
          ),
          team_members:team_member_id (
            id,
            name,
            permission
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserCompanies(data as UserCompany[] || []);
    } catch (error) {
      console.error('Error fetching user companies:', error);
      toast({
        title: "Error",
        description: "Failed to load your companies.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = async (userCompanyId: string, companyId: string, teamMemberId: string) => {
    setSelecting(true);
    try {
      // Set all user companies to inactive
      await supabase
        .from('user_companies')
        .update({ is_active: false })
        .eq('user_id', user!.id);

      // Set selected company as active
      const { error: updateError } = await supabase
        .from('user_companies')
        .update({ is_active: true })
        .eq('id', userCompanyId);

      if (updateError) throw updateError;

      // Get team member details
      const selectedCompany = userCompanies.find(uc => uc.id === userCompanyId);
      if (!selectedCompany) throw new Error('Company not found');

      // Update or create profile for this company (conflict on user_id)
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user!.id,
            username: selectedCompany.team_members.name,
            permission: selectedCompany.team_members.permission,
            team_member_id: teamMemberId,
            company_id: companyId
          },
          { onConflict: 'user_id' }
        )
        .select('*')
        .single();

      if (profileError) throw profileError;

      // Clear any dashboard caches when switching companies
      sessionStorage.clear();
      
      // Force clear all localStorage backup data to prevent cross-company data leakage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('_backup_') || key.includes('persistentMeetingId_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('🧹 CompanySelector: Cleared localStorage backups when switching companies:', keysToRemove);

      // Force refresh the profile in auth context to get updated company_id
      refreshProfile();

      toast({
        title: "Company selected",
        description: `You're now viewing ${selectedCompany.companies.name}.`
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
        <div className="text-center">
          <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">No Companies Found</h1>
          <p className="text-muted-foreground">
            Your email address is not associated with any companies yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please contact your administrator to be added to a company team.
          </p>
        </div>
      </div>
    );
  }

  if (userCompanies.length === 1) {
    // Auto-select if only one company and redirect
    const singleCompany = userCompanies[0];
    if (!singleCompany.is_active) {
      handleSelectCompany(singleCompany.id, singleCompany.company_id, singleCompany.team_member_id);
    }
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
                key={userCompany.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  userCompany.is_active 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleSelectCompany(
                  userCompany.id, 
                  userCompany.company_id, 
                  userCompany.team_member_id
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {userCompany.companies.logo_url ? (
                        <img 
                          src={userCompany.companies.logo_url} 
                          alt={`${userCompany.companies.name} logo`}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ 
                            backgroundColor: userCompany.companies.theme_color || '#3b82f6' 
                          }}
                        >
                          {userCompany.companies.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{userCompany.companies.name}</CardTitle>
                        <CardDescription>
                          {userCompany.team_members.permission === 'company_admin' 
                            ? 'Company Admin' 
                            : userCompany.team_members.permission === 'edit'
                            ? 'Editor'
                            : 'Viewer'
                          }
                        </CardDescription>
                      </div>
                    </div>
                    {userCompany.is_active && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Logged in as {userCompany.team_members.name}</span>
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