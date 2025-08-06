import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  company_id: string | null;
  role: 'admin' | 'user';
  username: string | null;
  permission: 'read' | 'edit' | 'company_admin';
  team_member_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
  theme_color?: string;
  services?: string[];
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  companies: Company[];
  loading: boolean;
  signUp: (email: string, password: string, username: string, role?: 'admin' | 'user') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  createCompany: (name: string) => Promise<{ data: Company | null; error: any }>;
  selectCompany: (companyId: string) => Promise<{ error: any }>;
  deleteCompany: (companyId: string) => Promise<{ error: any }>;
  fetchUserProfile: () => Promise<void>;
  fetchCompanies: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping profile fetch');
      return;
    }
    
    try {
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('Profile fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching profile:', error);
        
        // If no profile exists but user is authenticated, try to ensure setup is complete
        if (error.code === 'PGRST116' && user?.email) {
          console.log('No profile found, attempting to complete user setup...');
          try {
            const { error: setupError } = await supabase.rpc('ensure_user_setup_complete', {
              user_email: user.email
            });
            
            if (setupError) {
              console.error('Setup function error:', setupError);
            } else {
              console.log('Setup function completed, retrying profile fetch...');
              // Wait a moment then retry
              setTimeout(() => {
                if (user?.id) {
                  fetchProfileData(user.id);
                }
              }, 1000);
            }
          } catch (setupError) {
            console.error('Failed to run setup function:', setupError);
          }
        }
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Helper function to fetch profile data - needs to be accessible outside useEffect
  const fetchProfileData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      console.log('Profile fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching profile:', error);
        
        // If no profile exists, try to get the user's email and run setup
        if (error.code === 'PGRST116') {
          console.log('Profile not found, checking for user email to run setup...');
          const { data: authUser } = await supabase.auth.getUser();
          
          if (authUser.user?.email) {
            console.log('Attempting to complete user setup for:', authUser.user.email);
            try {
              const { error: setupError } = await supabase.rpc('ensure_user_setup_complete', {
                user_email: authUser.user.email
              });
              
              if (!setupError) {
                console.log('Setup completed, retrying profile fetch in 2 seconds...');
                // Give it a bit more time and retry once more
                setTimeout(async () => {
                  try {
                    const { data: retryData, error: retryError } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('user_id', userId)
                      .single();
                    
                    if (!retryError && retryData) {
                      setProfile(retryData);
                      await fetchCompaniesForProfile(retryData);
                    }
                  } catch (retryErr) {
                    console.error('Retry profile fetch failed:', retryErr);
                  }
                }, 2000);
              }
            } catch (setupError) {
              console.error('Setup function failed:', setupError);
            }
          }
        }
        return;
      }
      
      setProfile(data);
      // After setting profile, fetch companies
      await fetchCompaniesForProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Helper function to fetch companies for a specific profile
  const fetchCompaniesForProfile = async (profileData: Profile) => {
    try {
      let query = supabase.from('companies').select('*');
      
      console.log('Profile role:', profileData.role, 'Company ID:', profileData.company_id);
      
      // If user is not admin, only show their company
      if (profileData.role !== 'admin') {
        if (!profileData.company_id) {
          console.log('Non-admin user has no company_id, returning early');
          return;
        }
        query = query.eq('id', profileData.company_id);
        console.log('Fetching specific company for non-admin user');
      } else {
        console.log('Fetching all companies for admin user');
      }
      
      const { data, error } = await query;
      
      console.log('Companies fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }
      
      console.log('Setting companies:', data || []);
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchCompanies = async () => {
    console.log('fetchCompanies called, profile:', profile);
    if (!profile) {
      console.log('No profile found, returning early');
      return;
    }
    
    await fetchCompaniesForProfile(profile);
  };

  useEffect(() => {
    let mounted = true;
    
    // Helper function to fetch profile data
    const fetchProfileData = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        console.log('Profile fetch result:', { data, error });
        
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (mounted) {
          setProfile(data);
          // After setting profile, fetch companies
          await fetchCompaniesForProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    // Helper function to fetch companies for a specific profile
    const fetchCompaniesForProfile = async (profileData: Profile) => {
      try {
        let query = supabase.from('companies').select('*');
        
        console.log('Profile role:', profileData.role, 'Company ID:', profileData.company_id);
        
        // If user is not admin, only show their company
        if (profileData.role !== 'admin') {
          if (!profileData.company_id) {
            console.log('Non-admin user has no company_id, returning early');
            return;
          }
          query = query.eq('id', profileData.company_id);
          console.log('Fetching specific company for non-admin user');
        } else {
          console.log('Fetching all companies for admin user');
        }
        
        const { data, error } = await query;
        
        console.log('Companies fetch result:', { data, error });
        
        if (error) {
          console.error('Error fetching companies:', error);
          return;
        }
        
        if (mounted) {
          console.log('Setting companies:', data || []);
          setCompanies(data || []);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    
    // Set up auth state listener FIRST (before checking existing session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle profile fetching for authenticated users
        if (session?.user) {
          console.log('User logged in, deferring profile fetch...');
          // Use setTimeout(0) to defer Supabase calls and prevent auth context deadlocks
          setTimeout(() => {
            if (!mounted) return;
            fetchProfileData(session.user.id);
          }, 0);
        } else {
          // Clear data when user logs out
          setProfile(null);
          setCompanies([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => {
          if (!mounted) return;
          fetchProfileData(session.user.id);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch companies when profile changes
  useEffect(() => {
    if (profile) {
      fetchCompanies();
    }
  }, [profile]);

  const signUp = async (email: string, password: string, username: string, role: 'admin' | 'user' = 'user') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          role
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear only session storage when logging out to preserve data persistence
      // Keep localStorage data intact unless it's auth-related
      sessionStorage.clear();
      
      // Only clear specific auth-related localStorage items, preserve all data backups and analytics
      const authKeysToRemove = ['sb-gwywpkhxpbokmbhwsnod-auth-token'];
      authKeysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }
      
      // Explicitly reset state after successful sign out
      setUser(null);
      setSession(null);
      setProfile(null);
      setCompanies([]);
      
      return { error: null };
    } catch (error) {
      console.error('Sign out catch error:', error);
      return { error };
    }
  };

  const createCompany = async (name: string) => {
    console.log('Creating company with name:', name);
    console.log('Current user:', user?.id);
    console.log('Current profile:', profile);
    console.log('Is admin?', profile?.role === 'admin');
    console.log('Session token exists?', session?.access_token ? 'Yes' : 'No');
    
    if (!profile || profile.role !== 'admin') {
      console.log('Permission denied - not admin');
      return { data: null, error: { message: 'Only admins can create companies' } };
    }
    
    const { data, error } = await supabase
      .from('companies')
      .insert([{ name }])
      .select()
      .single();
    
    console.log('Create company result:', { data, error });
    
    if (!error && data) {
      setCompanies([...companies, data]);
    }
    
    return { data, error };
  };

  const selectCompany = async (companyId: string) => {
    if (!profile) {
      return { error: { message: 'No profile found' } };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ company_id: companyId })
      .eq('user_id', profile.user_id);
    
    if (!error) {
      setProfile({ ...profile, company_id: companyId });
      // Clear session storage when switching companies but preserve persistent data
      // Only clear dashboard section states, not analytics data
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('dashboard') || key.includes('section')) {
          sessionStorage.removeItem(key);
        }
      });
    }
    
    return { error };
  };

  const deleteCompany = async (companyId: string) => {
    if (!profile || profile.role !== 'admin') {
      return { error: { message: 'Only admins can delete companies' } };
    }
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);
    
    if (!error) {
      setCompanies(companies.filter(c => c.id !== companyId));
      // If the deleted company was the user's selected company, clear it
      if (profile.company_id === companyId) {
        setProfile({ ...profile, company_id: null });
      }
    }
    
    return { error };
  };

  return {
    user,
    session,
    profile,
    companies,
    loading,
    signUp,
    signIn,
    signOut,
    createCompany,
    selectCompany,
    deleteCompany,
    fetchUserProfile,
    fetchCompanies,
    refreshProfile: () => user && fetchProfileData(user.id)
  };
};

export { AuthContext };
