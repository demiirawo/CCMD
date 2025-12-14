import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

export const AdminAuth = () => {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast({
        title: "Credentials required",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }
    setAdminLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim().toLowerCase(),
        password: adminPassword
      });
      if (error) {
        throw error;
      }
      toast({
        title: "Login successful",
        description: "Welcome back, admin!"
      });
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAdminLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(258,85%,55%)]">
      <div className="mb-8">
        <img src="/lovable-uploads/eefb4933-6c9b-4dce-99ea-5a226304b377.png" alt="Logo" className="h-16 w-auto" />
      </div>
      
      <Card className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-semibold text-gray-900">Admin Login</CardTitle>
          <CardDescription className="text-gray-500">
            Sign in with your admin credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-gray-700">Email</Label>
              <Input 
                id="admin-email" 
                type="email" 
                placeholder="Enter your email" 
                value={adminEmail} 
                onChange={e => setAdminEmail(e.target.value)} 
                required 
                className="rounded-full bg-gray-50 border-gray-200 focus-visible:ring-0 focus-visible:border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Input 
                  id="admin-password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password" 
                  value={adminPassword} 
                  onChange={e => setAdminPassword(e.target.value)} 
                  required 
                  className="rounded-full bg-gray-50 border-gray-200 focus-visible:ring-0 focus-visible:border-gray-300"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 hover:bg-transparent" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full rounded-full bg-[hsl(345,65%,60%)] hover:bg-[hsl(345,65%,55%)] text-white font-medium py-3" 
              disabled={adminLoading}
            >
              {adminLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};