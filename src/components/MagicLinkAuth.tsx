import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, CheckCircle, Lock, Eye, EyeOff } from "lucide-react";
export const MagicLinkAuth = () => {
  const {
    toast
  } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted! handleMagicLink called');
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      console.log('Magic link request for email:', email.trim().toLowerCase());
      console.log('About to check if super admin...');

      // Check if this is the super admin email
      const isSuperAdmin = email.trim().toLowerCase() === 'demi.irawo@care-cuddle.co.uk';
      console.log('Is super admin?', isSuperAdmin);
      console.log('About to enter team member check branch...');
      if (!isSuperAdmin) {
        // Check if email exists in team members for regular users
        const {
          data: teamMembers,
          error: checkError
        } = await supabase.from('team_members').select('email, name, companies:company_id(name)').eq('email', email.trim().toLowerCase());
        console.log('Team member check result:', {
          teamMembers,
          checkError
        });
        console.log('Team members found:', teamMembers?.length || 0);
        if (checkError) {
          console.error('Team member check error:', checkError);
          throw checkError;
        }
        if (!teamMembers || teamMembers.length === 0) {
          console.log('No team members found for email:', email.trim().toLowerCase());
          toast({
            title: "Email not found",
            description: "This email address is not associated with any company teams. Please contact your administrator.",
            variant: "destructive"
          });
          return;
        }
        console.log('Team member found, proceeding with magic link');
      } else {
        console.log('Super admin email detected, proceeding with magic link');
      }

      // Send magic link
      console.log('Sending magic link to:', email.trim().toLowerCase());
      console.log('Redirect URL:', `${window.location.origin}/`);
      const {
        error
      } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      console.log('Magic link send result:', {
        error
      });
      if (error) {
        console.error('Magic link send error:', error);
        throw error;
      }
      setSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email for a secure sign-in link."
      });
    } catch (error: any) {
      console.error('Magic link error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send magic link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
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
      const {
        error
      } = await supabase.auth.signInWithPassword({
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
  if (sent) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a secure sign-in link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              <p>Click the link in your email to sign in securely.</p>
              <p className="mt-2">The link will expire in 1 hour for security.</p>
            </div>
            
            <Button variant="outline" className="w-full" onClick={() => {
            setSent(false);
            setEmail("");
          }}>
              Use Different Email
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src="/lovable-uploads/84bbf08a-ae99-4dc3-983c-58edd0b6546f.png" 
              alt="CCMD Logo" 
              className="h-24 w-auto mx-auto"
            />
          </div>
          <CardTitle>Sign In to Your Company</CardTitle>
          <CardDescription>
            Enter your email address to receive a secure sign-in link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={e => {
              console.log('Email input changed to:', e.target.value);
              setEmail(e.target.value);
            }} placeholder="Enter your work email" required disabled={loading} />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading || !email.trim()} onClick={() => console.log('Button clicked! Email:', email, 'Loading:', loading, 'Email valid:', !!email.trim())}>
              {loading ? <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Sending...
                 </div> : <div className="flex items-center gap-2">
                   Send Magic Link
                 </div>}
            </Button>
          </form>
          
          <div className="mt-4">
            <Separator className="my-4" />
            
            {!showAdminLogin ? <Button variant="outline" className="w-full gap-2 bg-stone-50" onClick={() => setShowAdminLogin(true)}>
                <Lock className="h-4 w-4" />
                Admin Login
              </Button> : <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Admin Login</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAdminLogin(false)}>
                    Cancel
                  </Button>
                </div>
                
                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input id="admin-email" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@company.com" required disabled={adminLoading} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input id="admin-password" type={showPassword ? "text" : "password"} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Enter password" required disabled={adminLoading} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={adminLoading}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={adminLoading || !adminEmail.trim() || !adminPassword.trim()}>
                    {adminLoading ? <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Signing in...
                      </div> : <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Sign In as Admin
                      </div>}
                  </Button>
                </form>
              </div>}
          </div>
          
          <div className="mt-6 text-xs text-muted-foreground text-center">
            <p>Only team members added by company administrators can sign in.</p>
            <p className="mt-1">Need access? Contact your company administrator.</p>
          </div>
        </CardContent>
      </Card>
    </div>;
};