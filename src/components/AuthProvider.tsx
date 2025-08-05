import React from 'react';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('AuthProvider rendering, current pathname:', window.location.pathname);
  const auth = useAuthProvider();
  console.log('AuthProvider - auth state:', { 
    user: !!auth.user, 
    profile: !!auth.profile, 
    loading: auth.loading,
    pathname: window.location.pathname 
  });
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};