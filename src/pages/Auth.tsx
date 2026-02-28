import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MagicLinkAuth } from "@/components/MagicLinkAuth";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Auth = () => {
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Listen for PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth page auth event:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('PASSWORD_RECOVERY event detected, showing password change dialog');
        setShowPasswordChange(true);
      }
    });

    // Also check URL hash for recovery token (type=recovery)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      console.log('Recovery token detected in URL hash');
      setShowPasswordChange(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('Auth useEffect:', { user: !!user, loading, returnTo: searchParams.get('returnTo'), showPasswordChange });
    
    // Don't redirect if password change is showing
    if (showPasswordChange) return;
    
    if (user && !loading) {
      // Check for pending company selection after re-authentication
      const pendingSelection = sessionStorage.getItem('pendingCompanySelection');
      
      if (pendingSelection) {
        handlePendingCompanySelection(pendingSelection);
      } else {
        const returnTo = searchParams.get('returnTo');
        console.log('Auth redirecting to:', returnTo || '/');
        navigate(returnTo || '/');
      }
    }
  }, [user, loading, navigate, searchParams, showPasswordChange]);

  const handlePasswordChangeComplete = () => {
    setShowPasswordChange(false);
    // Navigate to company selection / onboarding
    navigate('/company-selection');
  };

  const handlePendingCompanySelection = async (pendingSelectionJson: string) => {
    try {
      const { userCompanyId, companyId, teamMemberId, companyName } = JSON.parse(pendingSelectionJson);
      
      // Clear the pending selection
      sessionStorage.removeItem('pendingCompanySelection');
      
      console.log('🔄 Auth: Completing company selection for:', companyName);

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

      // Get team member details for the profile
      const { data: userCompanyData, error: fetchError } = await supabase
        .from('user_companies')
        .select(`
          team_members:team_member_id (
            name,
            permission
          )
        `)
        .eq('id', userCompanyId)
        .single();

      if (fetchError) throw fetchError;

      // Update or create profile for this company
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user!.id,
            username: userCompanyData.team_members.name,
            permission: userCompanyData.team_members.permission,
            team_member_id: teamMemberId,
            company_id: companyId
          },
          { onConflict: 'user_id' }
        );

      if (profileError) throw profileError;

      // Force refresh the profile to get updated company_id
      refreshProfile();

      toast({
        title: "Company selected",
        description: `You're now viewing ${companyName}.`
      });

      console.log('Auth redirecting to dashboard after company selection');
      navigate('/');
    } catch (error) {
      console.error('Error completing company selection:', error);
      sessionStorage.removeItem('pendingCompanySelection');
      
      toast({
        title: "Error",
        description: "Failed to complete company selection. Please try again.",
        variant: "destructive"
      });
      
      navigate('/company-selection');
    }
  };

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

  // Show password change dialog when recovery event fires
  if (showPasswordChange) {
    return <ChangePasswordDialog onComplete={handlePasswordChangeComplete} />;
  }

  return <MagicLinkAuth />;
};
