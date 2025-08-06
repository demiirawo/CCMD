
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, User, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, companies, signOut } = useAuth();
  const { currentCompany, isCompanyAdmin } = useCurrentCompany();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "CQC Checklist", path: "/cqc-checklist" },
    { name: "Meetings", path: "/meetings" },
    { name: "Report", path: "/reports" }
  ];

  // Only show settings for company admins and super admins
  const canAccessSettings = isCompanyAdmin || profile?.role === 'admin';
  
  if (canAccessSettings) {
    navItems.push({ name: "Settings", path: "/settings" });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleChangeCompany = () => {
    navigate('/company-selection');
  };

  return (
    <nav className="bg-primary text-primary-foreground border-b border-primary/20 px-6 py-3 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.path
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img 
              src="/lovable-uploads/e1ca0619-7102-433c-b82c-7559369d24e5.png" 
              alt="Application Logo" 
              className="h-16 w-auto"
            />
          </div>

          <div className="flex items-center gap-4">
            {currentCompany && (
              <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
                {currentCompany.company_logo_url && (
                  <img 
                    src={currentCompany.company_logo_url} 
                    alt={`${currentCompany.company_name} logo`} 
                    className="h-6 w-6 object-contain rounded"
                  />
                )}
                <span>{currentCompany.company_name}</span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <User className="h-4 w-4 mr-2" />
                  {profile?.username || 'User'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white z-50 border shadow-lg">
                <DropdownMenuLabel className="bg-white">
                  {profile?.username || 'User'}
                  <p className="text-xs text-muted-foreground font-normal">
                    {profile?.role === 'admin' ? 'Administrator' : 'User'}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onClick={handleChangeCompany}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Change Company
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
