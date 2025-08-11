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
        .maybeSingle();
      
      console.log('Profile fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      if (!data) {
        console.warn('No profile found; creating minimal profile');
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id, username: user.email?.split('@')[0] ?? null })
          .select('*')
          .single();
        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }
        setProfile(created);
      } else {
        setProfile(data);
      }
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
        .maybeSingle();
      
      console.log('Profile fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      if (!data) {
        console.warn('No profile found for user; creating minimal profile');
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: userId })
          .select('*')
          .single();
        if (insertError) {
          console.error('Error creating profile:', insertError);
          return;
        }
        setProfile(created);
        await fetchCompaniesForProfile(created);
      } else {
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
      console.log('Profile role:', profileData.role, 'User ID:', profileData.user_id);
      
      // Now we can simply fetch from companies table since RLS will handle the filtering
      console.log('Fetching companies via RLS filtering');
      
      const { data, error } = await supabase
        .from('companies')
        .select('*');
      
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
    try {
      // Always attempt to fetch companies; RLS will return only accessible ones
      const { data, error } = await supabase
        .from('companies')
        .select('*');

      console.log('fetchCompanies result:', { data, error });

      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error('Unexpected error fetching companies:', error);
    }
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
    
    const isSuperAdmin = user?.email === 'demi.irawo@care-cuddle.co.uk';
    if (!isSuperAdmin) {
      console.log('Permission denied - not super admin');
      return { data: null, error: { message: 'Only super admins can create companies' } };
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
    if (!profile || !user?.id) {
      return { error: { message: 'No profile or user found' } };
    }

    // 1) Deactivate any currently active company links for this user
    const { error: deactivateError } = await supabase
      .from('user_companies')
      .update({ is_active: false })
      .eq('user_id', profile.user_id);
    if (deactivateError) {
      console.error('Error deactivating companies:', deactivateError);
    }

    // 2) Try to activate an existing link for this company
    const { data: activatedRows, error: activateError } = await supabase
      .from('user_companies')
      .update({ is_active: true })
      .eq('user_id', profile.user_id)
      .eq('company_id', companyId)
      .select('id');
    if (activateError) {
      console.error('Error activating company:', activateError);
    }

    // 3) If no link existed to activate, create one using team_members mapping
    if (!activateError && (!activatedRows || activatedRows.length === 0)) {
      try {
        // Find the team member record for this user's email within the target company
        const { data: teamMember, error: tmError } = await supabase
          .from('team_members')
          .select('id')
          .eq('company_id', companyId)
          .eq('email', user.email!)
          .maybeSingle();

        if (tmError) {
          console.error('Error finding team member:', tmError);
        }

        if (teamMember?.id) {
          const { error: insertError } = await supabase
            .from('user_companies')
            .insert({
              user_id: profile.user_id,
              team_member_id: teamMember.id,
              company_id: companyId,
              is_active: true,
            });
          if (insertError) {
            console.error('Error inserting user_company link:', insertError);
          }
        } else {
          console.warn('No team member mapping found for user in this company; cannot create link.');
        }
      } catch (e) {
        console.error('Unexpected error creating user_company link:', e);
      }
    }

    // 4) Also reflect selection in profiles for convenience and super admin flows
    const { error } = await supabase
      .from('profiles')
      .update({ company_id: companyId })
      .eq('user_id', profile.user_id);
    
    if (!error) {
      setProfile({ ...profile, company_id: companyId });
      // Clear session storage when switching companies to reset dashboard section states
      sessionStorage.clear();
    }
    
    return { error: error || activateError || deactivateError };
  };
  const deleteCompany = async (companyId: string) => {
    const isSuperAdmin = user?.email === 'demi.irawo@care-cuddle.co.uk';
    if (!isSuperAdmin) {
      return { error: { message: 'Only super admins can delete companies' } };
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
