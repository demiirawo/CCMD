import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building, Search, Trash2, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Company = {
  id: string;
  name: string;
  logo_url?: string;
  theme_color?: string;
  services?: string[];
  created_at: string;
  updated_at: string;
};

export const AdminCompanyManager = () => {
  const { profile, companies, fetchCompanies } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);

  // Filter companies based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCompanies([]);
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const handleSelectCompany = async (company: Company) => {
    setLoading(true);
    try {
      // Update the admin's profile to the selected company
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      setSelectedCompany(company);
      toast({
        title: "Company selected",
        description: `You're now viewing ${company.name}.`
      });

      // Refresh the page to update all contexts
      window.location.reload();
    } catch (error) {
      console.error('Error selecting company:', error);
      toast({
        title: "Error",
        description: "Failed to select company.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    setDeletingCompanyId(company.id);
    try {
      // Delete the company
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) throw error;

      toast({
        title: "Company deleted",
        description: `${company.name} has been successfully deleted.`
      });

      // Refresh companies list
      await fetchCompanies();
      
      // Clear search if the deleted company was in results
      if (filteredCompanies.some(c => c.id === company.id)) {
        setSearchTerm("");
      }

    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete company.",
        variant: "destructive"
      });
    } finally {
      setDeletingCompanyId(null);
    }
  };

  // Only admins can access this component
  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchTerm.trim() !== "" && (
            <div className="space-y-2">
              {filteredCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No companies found matching "{searchTerm}"
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {company.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={`${company.name} logo`}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ 
                              backgroundColor: company.theme_color || '#3b82f6' 
                            }}
                          >
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {company.services?.length || 0} services
                          </p>
                        </div>
                        {profile?.company_id === company.id && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectCompany(company)}
                          disabled={loading || profile?.company_id === company.id}
                        >
                          {profile?.company_id === company.id ? "Selected" : "Select"}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deletingCompanyId === company.id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Company</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{company.name}"? This action cannot be undone and will permanently delete:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>All company data and settings</li>
                                  <li>All team members and user access</li>
                                  <li>All meeting records and documents</li>
                                  <li>All analytics and reports</li>
                                </ul>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCompany(company)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {deletingCompanyId === company.id ? "Deleting..." : "Delete Company"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {searchTerm.trim() === "" && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Start typing to search for companies...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};