
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  role: 'admin' | 'user';
  active_company_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: string;
  name: string;
  slug?: string;
  theme_color?: string;
  services?: string[];
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

interface UserCompany {
  team_member_id: string;
  company_id: string;
  company_name: string;
  company_slug: string | null;
  company_logo_url: string | null;
  company_theme_color: string | null;
  display_name: string;
  permission: 'read' | 'edit' | 'company_admin';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  companies: Company[];
  userCompanies: UserCompany[];
  loading: boolean;
  getCurrentCompanyId: () => string | null;
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
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get current company ID
  const getCurrentCompanyId = () => {
    return profile?.active_company_id || null;
  };

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
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Function to ensure user setup is complete by calling the database function
  const ensureUserSetupComplete = async (userEmail: string) => {
    try {
      console.log('=== ensureUserSetupComplete called ===');
      console.log('User email:', userEmail);
      
      // Call the database function to ensure setup is complete
      const { error } = await supabase.rpc('ensure_user_setup_complete', {
        user_email: userEmail
      });
      
      if (error) {
        console.error('Error ensuring user setup:', error);
        return false;
      }
      
      console.log('User setup completed successfully');
      return true;
    } catch (error) {
      console.error('Error in ensureUserSetupComplete:', error);
      return false;
    }
  };

  // Fetch user companies using the new database function
  const fetchUserCompanies = async (userEmail: string) => {
    try {
      console.log('=== fetchUserCompanies called ===');
      console.log('User email:', userEmail);
      
      const { data, error } = await supabase.rpc('get_user_companies', {
        user_email: userEmail
      });
      
      console.log('User companies query result:', { data, error });
      
      if (error) {
        console.error('Error fetching user companies:', error);
        return;
      }
      
      // Convert the data to match our UserCompany interface
      const userCompaniesData: UserCompany[] = (data || []).map((item: any) => ({
        team_member_id: item.team_member_id,
        company_id: item.company_id,
        company_name: item.company_name,
        company_slug: item.company_slug,
        company_logo_url: item.company_logo_url,
        company_theme_color: item.company_theme_color,
        display_name: item.display_name,
        permission: item.permission,
        is_active: item.is_active
      }));
      
      console.log('Setting user companies:', userCompaniesData);
      setUserCompanies(userCompaniesData);
      
      // Also set companies array for backward compatibility
      const companiesArray: Company[] = userCompaniesData.map(uc => ({
        id: uc.company_id,
        name: uc.company_name,
        slug: uc.company_slug || undefined,
        theme_color: uc.company_theme_color || undefined,
        logo_url: uc.company_logo_url || undefined,
        created_at: '',
        updated_at: '',
        services: []
      }));
      
      setCompanies(companiesArray);
    } catch (error) {
      console.error('Error fetching user companies:', error);
    }
  };

  // Helper function to fetch profile data
  const fetchProfileData = async (userId: string, userEmail?: string) => {
    try {
      console.log('=== fetchProfileData called ===');
      console.log('User ID:', userId);
      console.log('User email:', userEmail);
      
      // Ensure user setup is complete if we have the email
      if (userEmail) {
        const setupComplete = await ensureUserSetupComplete(userEmail);
        if (!setupComplete) {
          console.error('Failed to complete user setup');
        }
        
        // Fetch user companies
        await fetchUserCompanies(userEmail);
      }
      
      // Then get the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      console.log('Profile fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching profile:', error);
        // If no profile exists, this might be a new user - try to set it up
        if (error.code === 'PGRST116' && userEmail) {
          console.log('No profile found, attempting to create one...');
          await ensureUserSetupComplete(userEmail);
          // Try fetching profile again
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (!retryError && retryData) {
            setProfile(retryData);
          }
        }
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCompanies = async () => {
    console.log('fetchCompanies called, user:', user?.id, user?.email);
    if (!user?.email) {
      console.log('No user email found, returning early');
      return;
    }
    
    // Fetch user companies using email
    await fetchUserCompanies(user.email);
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST (before checking existing session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle profile fetching for authenticated users
        if (session?.user) {
          console.log('User authenticated, setting up profile...');
          // Use setTimeout(0) to defer Supabase calls and prevent auth context deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            await fetchProfileData(session.user.id, session.user.email);
          }, 0);
        } else {
          // Clear data when user logs out
          setProfile(null);
          setCompanies([]);
          setUserCompanies([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(async () => {
          if (!mounted) return;
          await fetchProfileData(session.user.id, session.user.email);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
      // Clear session storage when logging out
      sessionStorage.clear();
      
      // Clear only auth-related localStorage items, preserve analytics backups
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('_backup_') && !key.includes('_analytics')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
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
      setUserCompanies([]);
      
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
      .update({ active_company_id: companyId })
      .eq('user_id', profile.user_id);
    
    if (!error) {
      setProfile({ ...profile, active_company_id: companyId });
      // Clear session storage when switching companies to reset dashboard section states
      sessionStorage.clear();
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
      setUserCompanies(userCompanies.filter(uc => uc.company_id !== companyId));
      // If the deleted company was the user's selected company, clear it
      if (profile.active_company_id === companyId) {
        setProfile({ ...profile, active_company_id: null });
      }
    }
    
    return { error };
  };

  return {
    user,
    session,
    profile,
    companies,
    userCompanies,
    loading,
    getCurrentCompanyId,
    signUp,
    signIn,
    signOut,
    createCompany,
    selectCompany,
    deleteCompany,
    fetchUserProfile,
    fetchCompanies,
    refreshProfile: () => user && fetchProfileData(user.id, user.email)
  };
};

export { AuthContext };
