import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
export const MagicLinkAuth = () => {
  const {
    toast
  } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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
  if (sent) {
    return <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/lovable-uploads/c284f1d4-0ce1-4b48-914f-b68e0ba31623.png)'}}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              
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
  return <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/lovable-uploads/c284f1d4-0ce1-4b48-914f-b68e0ba31623.png)'}}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src="/lovable-uploads/eefb4933-6c9b-4dce-99ea-5a226304b377.png" alt="CCMD Logo" className="h-24 w-auto" />
          </div>
          
          
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-semibold text-foreground">Welcome Back!</h2>
          </div>
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="focus-visible:ring-stone-50 bg-neutral-100" />
            </div>
            <Button type="submit" disabled={loading} className="w-full text-base bg-neutral-400 hover:bg-neutral-300 text-black">
              {loading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>;
};