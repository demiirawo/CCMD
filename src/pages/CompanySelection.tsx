import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2, Trash2, Search, Copy } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
export const CompanySelection = () => {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const {
    profile,
    companies,
    createCompany,
    selectCompany,
    deleteCompany,
    signOut,
    fetchCompanies,
    loading: authLoading
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
      await handleSelectCompany(data.id);
    }
    setLoading(false);
  };
  const handleSelectCompany = async (companyId: string) => {
    console.log('Selecting company:', companyId);
    setLoading(true);
    const {
      error
    } = await selectCompany(companyId);
    console.log('Select company result:', {
      error
    });
    if (error) {
      console.error('Error selecting company:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      setLoading(false);
    } else {
      console.log('Company selected successfully, navigating to /');
      toast({
        title: 'Success',
        description: 'Company selected successfully!'
      });
      navigate('/');
      setLoading(false);
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
  const handleCopyCompanyLink = async (company: any) => {
    const companyUrl = `${window.location.origin}/company/${company.slug || company.id}`;
    try {
      await navigator.clipboard.writeText(companyUrl);
      toast({
        title: 'Success',
        description: 'Company dashboard link copied to clipboard!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive'
      });
    }
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

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchValue.trim()) return companies;
    return companies.filter(company => company.name.toLowerCase().includes(searchValue.toLowerCase()));
  }, [companies, searchValue]);
  return <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Welcome, {profile?.username || 'User'}!</CardTitle>
              
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
            <Button variant="outline" onClick={handleRefreshCompanies}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Search Companies</h3>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search company name..." value={searchValue} onChange={e => setSearchValue(e.target.value)} className="pl-9" />
              </div>
            </div>

            {filteredCompanies.length > 0 && <div className="space-y-2">
                {searchValue.trim() && <p className="text-sm text-muted-foreground">
                  {filteredCompanies.length} result{filteredCompanies.length !== 1 ? 's' : ''} found
                </p>}
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {filteredCompanies.map(company => <Card key={company.id} className="hover:bg-accent transition-colors">
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
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCopyCompanyLink(company)} 
                              disabled={loading}
                              className="hover:bg-accent"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleSelectCompany(company.id)} disabled={loading} className="bg-stone-400 hover:bg-stone-300 text-black">
                              Select
                            </Button>
                            {profile?.role === 'admin' && <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive-foreground hover:bg-destructive" disabled={loading}>
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
                                    <AlertDialogAction onClick={() => handleDeleteCompany(company.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Delete Company
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>
              </div>}
              
              {searchValue.trim() && filteredCompanies.length === 0 && <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No companies found matching "{searchValue}"</p>
              </div>}

            {!searchValue.trim() && companies.length === 0 && <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Companies Found</h3>
                <p className="text-muted-foreground mb-4">
                  {profile?.role === 'admin' ? 'Create your first company to get started' : 'Contact your administrator to be assigned to a company'}
                </p>
              </div>}

            {!searchValue.trim() && companies.length > 0}
          </div>
          
          {profile?.role === 'admin' && <div className="border-t pt-6">
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
                      <Input id="company-name" placeholder="Enter company name" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
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
            </div>}
        </CardContent>
      </Card>
    </div>;
};