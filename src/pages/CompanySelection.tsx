import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2, Trash2, ChevronDown, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

export const CompanySelection = () => {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [allActions, setAllActions] = useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  const {
    user,
    profile,
    companies,
    createCompany,
    selectCompany,
    deleteCompany,
    signOut,
    fetchCompanies,
    loading: authLoading,
    refreshProfile
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  // Debug logging
  console.log('CompanySelection Debug:', {
    profile,
    companies,
    companiesLength: companies.length,
    authLoading,
    localLoading: loading
  });

  // Debug logging
  console.log('CompanySelection Debug:', {
    profile,
    companies,
    companiesLength: companies.length
  });

  const isSuperAdmin = user?.email === 'demi.irawo@care-cuddle.co.uk';

  const filteredCompanies = React.useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(c => (c.name || '').toLowerCase().includes(q));
  }, [companies, companySearch]);

  const handleRefreshCompanies = async () => {
    console.log('Manually refreshing companies...');
    await fetchCompanies();
  };

  const clearAllCompanyData = (companyId: string) => {
    // Clear all localStorage data related to meetings and forms for new companies
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(companyId)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Also clear any persistent meeting IDs for this company
    localStorage.removeItem(`persistentMeetingId_${companyId}`);
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive'
      });
      return;
    }
    // Prevent duplicate company names (case-insensitive)
    const normalizedNew = newCompanyName.trim().toLowerCase();
    const exists = companies.some(c => (c.name || '').trim().toLowerCase() === normalizedNew);
    if (exists) {
      toast({
        title: 'Duplicate name',
        description: 'A company with this name already exists.',
        variant: 'destructive'
      });
      return;
    }
    setLoading(true);
    const {
      data,
      error
    } = await createCompany(newCompanyName);
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else if (data) {
      // Clear all localStorage data for the new company to ensure blank inputs
      clearAllCompanyData(data.id);
      toast({
        title: 'Success',
        description: 'Company created successfully!'
      });
      setNewCompanyName('');
      setCreateDialogOpen(false);
      // Automatically select the new company
      await handleSelectCompany(data);
    }
    setLoading(false);
  };

  const handleSelectCompany = async (company: any) => {
    console.log('handleSelectCompany called with:', company);
    console.log('Company slug:', company.slug);
    
    try {
      // First, select the company in the auth context
      console.log('Calling selectCompany with ID:', company.id);
      await selectCompany(company.id);
      console.log('selectCompany completed');
      
      const slug = company.slug || company.name.toLowerCase().replace(/\s+/g, '-');
      console.log('Final slug for navigation:', slug);
      console.log('Navigating to:', `/company/${slug}`);
      navigate(`/company/${slug}`);
      console.log('Navigation completed');
    } catch (error) {
      console.error('Error in handleSelectCompany:', error);
      toast({
        title: 'Error',
        description: 'Failed to navigate to company',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    setLoading(true);
    const {
      error
    } = await deleteCompany(companyId);
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Company deleted successfully!'
      });
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to sign out. Please try again.',
          variant: 'destructive'
        });
        console.error('Sign out error:', error);
        return;
      }
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error', 
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Fetch all actions across accessible companies for the current user
  const fetchAllActions = async () => {
    console.log('Fetching my actions for current user...');
    setActionsLoading(true);
    try {
      const username = profile?.username || '';
      const email = user?.email || '';

      let query = supabase
        .from('actions_log')
        .select(`
          *,
          companies!inner(name)
        `)
        .eq('closed', false)
        .order('due_date', { ascending: true });

      if (username && email) {
        // Use PostgREST or() syntax with wildcard * for ilike
        query = query.or(
          `mentioned_attendee.ilike.*${username}*,mentioned_attendee.ilike.*${email}*`
        );
      } else if (username) {
        query = query.ilike('mentioned_attendee', `%${username}%`);
      } else if (email) {
        query = query.ilike('mentioned_attendee', `%${email}%`);
      } else {
        setAllActions([]);
        setActionsLoading(false);
        return;
      }

      const { data, error } = await query;
      console.log('Actions query result:', { data, error });
      if (error) throw error;
      setAllActions(data || []);
      console.log('Set actions:', data?.length || 0, 'actions found');
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch actions',
        variant: 'destructive'
      });
    } finally {
      setActionsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Actions effect triggered:', { actionsOpen, username: profile?.username, email: user?.email });
    if (actionsOpen && (profile?.username || user?.email)) {
      fetchAllActions();
    }
  }, [actionsOpen, profile?.username, user?.email]);

  // Ensure user-company linkage exists for magic link sign-ins
  useEffect(() => {
    const ensureSetup = async () => {
      try {
        if (!authLoading && user?.email && companies.length === 0) {
          console.log('No companies found. Ensuring user setup for:', user.email);
          const { data, error } = await supabase.rpc('ensure_user_setup_complete', { user_email: user.email });
          console.log('ensure_user_setup_complete result:', { data, error });
          // Refresh profile and companies after ensuring setup
          await refreshProfile();
          await fetchCompanies();
        }
      } catch (e) {
        console.error('Error ensuring user setup:', e);
      }
    };
    ensureSetup();
  }, [authLoading, user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Welcome, {profile?.username || 'User'}!</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefreshCompanies}>
                Refresh
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {companies.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Your Companies</h3>
                <div>
                  <Label htmlFor="company-search" className="sr-only">Search companies</Label>
                  <Input
                    id="company-search"
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {filteredCompanies.map(company => (
                    <Card key={company.id} className="hover:bg-accent transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{company.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Created {new Date(company.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => handleSelectCompany(company)} 
                              disabled={loading} 
                              className="bg-stone-400 hover:bg-stone-300 text-black"
                            >
                              Select
                            </Button>
                            {isSuperAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive" 
                                    disabled={loading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Company</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{company.name}"? This action cannot be undone and will permanently delete all company data including meetings, actions, and analytics.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteCompany(company.id)} 
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete Company
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {companies.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Companies Found</h3>
                <p className="text-muted-foreground mb-4">
                  {isSuperAdmin ? 'Create your first company to get started' : 'Contact your administrator to be assigned to a company'}
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center gap-2">
                    My Actions
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    {actionsLoading ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Loading actions...</p>
                      </div>
                    ) : allActions.length === 0 ? (
                      <div className="text-center py-4">
                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No actions found</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {allActions.map((action) => (
                          <div key={action.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-xs text-black mb-1">
                                {action.action_text}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {action.companies?.name} • Due: {action.due_date}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          {isSuperAdmin && (
            <div className="border-t pt-6">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-zinc-400 hover:bg-zinc-300 text-black">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Company
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Company</DialogTitle>
                    <DialogDescription>
                      Enter a name for your new company profile.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input 
                        id="company-name" 
                        placeholder="Enter company name" 
                        value={newCompanyName} 
                        onChange={e => setNewCompanyName(e.target.value)} 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCompany} disabled={loading}>
                      {loading ? 'Creating...' : 'Create Company'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
