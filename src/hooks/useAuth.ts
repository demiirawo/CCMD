
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
        return;
      }
      
      console.log('User setup completed successfully');
    } catch (error) {
      console.error('Error in ensureUserSetupComplete:', error);
    }
  };

  // Helper function to fetch profile data - needs to be accessible outside useEffect
  const fetchProfileData = async (userId: string, userEmail?: string) => {
    try {
      console.log('=== fetchProfileData called ===');
      console.log('User ID:', userId);
      console.log('User email:', userEmail);
      
      // Ensure user setup is complete if we have the email
      if (userEmail) {
        await ensureUserSetupComplete(userEmail);
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
        return;
      }
      
      setProfile(data);
      // After setting profile, fetch companies using the new approach
      await fetchCompaniesForUser(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // New function to fetch companies based on user_companies table
  const fetchCompaniesForUser = async (userId: string) => {
    try {
      console.log('=== fetchCompaniesForUser called ===');
      console.log('User ID for company fetch:', userId);
      
      const { data: userCompaniesData, error } = await supabase
        .from('user_companies')
        .select(`
          companies:company_id (
            id,
            name,
            theme_color,
            services,
            logo_url,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId);
      
      console.log('User companies query result:', { userCompaniesData, error });
      
      if (error) {
        console.error('Error fetching user companies:', error);
        return;
      }
      
      // Extract companies from the nested structure and filter out nulls
      const companiesArray = userCompaniesData
        ?.map(uc => uc.companies)
        .filter(c => c !== null) || [];
      
      console.log('Extracted companies array:', companiesArray);
      console.log('Setting companies:', companiesArray.length, 'companies found');
      setCompanies(companiesArray);
    } catch (error) {
      console.error('Error fetching companies for user:', error);
    }
  };

  // Helper function to fetch companies for a specific profile (legacy method for admin)
  const fetchCompaniesForProfile = async (profileData: Profile) => {
    try {
      console.log('=== fetchCompaniesForProfile called (legacy admin method) ===');
      console.log('Profile role:', profileData.role, 'Company ID:', profileData.company_id);
      
      // For admin users, show all companies (legacy behavior)
      if (profileData.role === 'admin') {
        console.log('Fetching all companies for admin user');
        const { data, error } = await supabase
          .from('companies')
          .select('*');
        
        console.log('Admin companies fetch result:', { data, error });
        
        if (error) {
          console.error('Error fetching companies:', error);
          return;
        }
        
        console.log('Setting companies (admin):', data || []);
        setCompanies(data || []);
      } else {
        // For non-admin users, use the new user_companies approach
        await fetchCompaniesForUser(profileData.user_id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchCompanies = async () => {
    console.log('fetchCompanies called, user:', user?.id);
    if (!user?.id) {
      console.log('No user found, returning early');
      return;
    }
    
    // Use the new user-based company fetching
    await fetchCompaniesForUser(user.id);
  };

  useEffect(() => {
    let mounted = true;
    
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
            fetchProfileData(session.user.id, session.user.email);
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
          fetchProfileData(session.user.id, session.user.email);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch companies when profile changes (legacy support)
  useEffect(() => {
    if (profile && profile.role === 'admin') {
      fetchCompaniesForProfile(profile);
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
    refreshProfile: () => user && fetchProfileData(user.id, user.email)
  };
};

export { AuthContext };
