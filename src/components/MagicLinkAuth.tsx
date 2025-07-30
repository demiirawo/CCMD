import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, CheckCircle } from "lucide-react";

export const MagicLinkAuth = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Check if email exists in team members
      const { data: teamMembers, error: checkError } = await supabase
        .from('team_members')
        .select('email, name, companies:company_id(name)')
        .eq('email', email.trim().toLowerCase());

      if (checkError) throw checkError;

      if (!teamMembers || teamMembers.length === 0) {
        toast({
          title: "Email not found",
          description: "This email address is not associated with any company teams. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email for a secure sign-in link.",
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Use Different Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Mail className="h-16 w-16 text-primary" />
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
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Magic Link
                </div>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-xs text-muted-foreground text-center">
            <p>Only team members added by company administrators can sign in.</p>
            <p className="mt-1">Need access? Contact your company administrator.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};