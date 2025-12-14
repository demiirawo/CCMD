import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
export const MagicLinkAuth = () => {
  const {
    toast
  } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted! handleMagicLink called');

    // Clear any previous error messages
    setErrorMessage("");
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      console.log('Magic link request for email:', email.trim().toLowerCase());

      // Check if this is the super admin email
      const isSuperAdmin = email.trim().toLowerCase() === 'demi.irawo@care-cuddle.co.uk';
      if (!isSuperAdmin) {
        // Check if email exists in team members for regular users
        const {
          data: teamMembers,
          error: checkError
        } = await supabase.from('team_members').select('email, name').ilike('email', email.trim());
        if (checkError) {
          console.error('Team member check error:', checkError);
          toast({
            title: "Error",
            description: "Unable to verify email address. Please try again.",
            variant: "destructive"
          });
          return;
        }
        if (!teamMembers || teamMembers.length === 0) {
          setErrorMessage("This email address is not registered with any company. Please check your email address or contact your administrator for access.");
          return;
        }
      }

      // Send magic link
      const {
        error
      } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          shouldCreateUser: true
        }
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
    return <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(258,85%,55%)]">
        {/* Logo above card */}
        <div className="mb-8">
          <img src="/lovable-uploads/eefb4933-6c9b-4dce-99ea-5a226304b377.png" alt="CCMD Logo" className="h-16 w-auto" />
        </div>
        
        {/* White card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Check Your Email</h2>
            <p className="text-gray-500 mt-2">
              We've sent a secure sign-in link to <strong className="text-gray-900">{email}</strong>
            </p>
          </div>
          
          <div className="text-sm text-gray-500 text-center mb-6">
            <p>Click the link in your email to sign in securely.</p>
            <p className="mt-2">The link will expire in 1 hour for security.</p>
          </div>
          
          <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50" onClick={() => {
          setSent(false);
          setEmail("");
        }}>
            Use Different Email
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(258,85%,55%)]">
      {/* Logo above card */}
      <div className="mb-8">
        <img alt="CCMD Logo" src="/lovable-uploads/3747134b-891f-4ca8-b732-d0a519f53c91.png" className="h-40 w-auto" />
      </div>
      
      {/* White card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        {errorMessage && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>}
        
        <form onSubmit={handleMagicLink} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => {
            setEmail(e.target.value);
            if (errorMessage) setErrorMessage("");
          }} required className="h-12 rounded-xl border-gray-200 bg-white placeholder:text-gray-400 focus-visible:ring-[hsl(258,85%,55%)]" />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-medium bg-[hsl(345,65%,60%)] hover:bg-[hsl(345,65%,55%)] text-white shadow-lg">
            {loading ? "Sending..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>;
};