import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { MagicLinkAuth } from "@/components/MagicLinkAuth";

export const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('Auth useEffect:', { user: !!user, loading, returnTo: searchParams.get('returnTo') });
    if (user && !loading) {
      const returnTo = searchParams.get('returnTo');
      console.log('Auth redirecting to:', returnTo || '/');
      navigate(returnTo || '/');
    }
  }, [user, loading, navigate, searchParams]);

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

  return <MagicLinkAuth />;
};