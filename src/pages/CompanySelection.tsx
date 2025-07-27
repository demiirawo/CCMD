import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2 } from 'lucide-react';

export const CompanySelection = () => {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { profile, companies, createCompany, selectCompany, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
    
    const { data, error } = await createCompany(newCompanyName);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else if (data) {
      toast({
        title: 'Success',
        description: 'Company created successfully!',
      });
      setNewCompanyName('');
      setCreateDialogOpen(false);
      // Automatically select the new company
      await handleSelectCompany(data.id);
    }
    
    setLoading(false);
  };

  const handleSelectCompany = async (companyId: string) => {
    setLoading(true);
    
    const { error } = await selectCompany(companyId);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Company selected successfully!',
      });
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Welcome, {profile?.username || 'User'}!</CardTitle>
              <CardDescription>
                {profile?.role === 'admin' 
                  ? 'Select a company to manage or create a new one'
                  : 'Select your company to continue'
                }
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {companies.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Companies</h3>
              <div className="grid gap-4">
                {companies.map((company) => (
                  <Card key={company.id} className="cursor-pointer hover:bg-accent transition-colors">
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
                        <Button 
                          onClick={() => handleSelectCompany(company.id)}
                          disabled={loading}
                        >
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Companies Found</h3>
              <p className="text-muted-foreground mb-4">
                {profile?.role === 'admin' 
                  ? 'Create your first company to get started'
                  : 'Contact your administrator to be assigned to a company'
                }
              </p>
            </div>
          )}
          
          {profile?.role === 'admin' && (
            <div className="border-t pt-6">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
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
                        onChange={(e) => setNewCompanyName(e.target.value)}
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