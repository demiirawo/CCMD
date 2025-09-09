import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ActiveSession {
  id: string;
  user_id: string;
  company_id: string;
  session_token: string;
  browser_tab_id: string;
  last_active: string;
  is_active: boolean;
}

/**
 * Hook to manage user sessions and prevent multiple company logins
 * Ensures one active company session per user across all browser tabs
 */
export const useSessionManager = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [sessionChecking, setSessionChecking] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);
  const tabIdRef = useRef<string | null>(null);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate unique session identifiers
  const generateSessionToken = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  const getTabId = useCallback(() => {
    let tabId = sessionStorage.getItem('__session_tab_id');
    if (!tabId) {
      tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('__session_tab_id', tabId);
    }
    return tabId;
  }, []);

  // Initialize session token and tab ID
  useEffect(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = generateSessionToken();
    }
    if (!tabIdRef.current) {
      tabIdRef.current = getTabId();
    }
  }, [generateSessionToken, getTabId]);

  // Create or update session in database
  const createSession = useCallback(async (companyId: string) => {
    if (!user || !sessionTokenRef.current || !tabIdRef.current) return null;

    try {
      // First invalidate other sessions for this user
      await supabase.rpc('invalidate_other_company_sessions', {
        p_user_id: user.id,
        p_company_id: companyId,
        p_current_session_token: sessionTokenRef.current
      });

      // Create new session
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          company_id: companyId,
          session_token: sessionTokenRef.current,
          browser_tab_id: tabIdRef.current,
          last_active: new Date().toISOString(),
          is_active: true
        }, {
          onConflict: 'user_id,company_id,is_active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      console.log('🔐 Session created successfully:', {
        sessionToken: sessionTokenRef.current,
        tabId: tabIdRef.current,
        companyId
      });

      return data;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }, [user]);

  // Validate current session
  const validateSession = useCallback(async () => {
    if (!user || !profile?.company_id || !sessionTokenRef.current) {
      return true; // No session to validate yet
    }

    // Skip validation if user is still being set up (no company selected yet)
    if (!profile.company_id) {
      return true;
    }

    setSessionChecking(true);

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', profile.company_id)
        .eq('session_token', sessionTokenRef.current)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Session validation error:', error);
        return true; // Don't sign out on database errors
      }

      if (!data) {
        console.warn('🚨 Session validation failed - session not found or inactive');
        
        // Only invalidate session if user has been authenticated for more than 10 seconds
        // This prevents immediate logout during the login process
        const loginTime = sessionStorage.getItem('__login_time');
        if (loginTime && Date.now() - parseInt(loginTime) < 10000) {
          console.log('🕐 Skipping session invalidation - user recently logged in');
          return true;
        }
        
        setIsSessionValid(false);
        
        // Check if user has another active session in a different company
        const { data: otherSessions } = await supabase
          .from('user_sessions')
          .select('*, companies(name)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .neq('company_id', profile.company_id);

        if (otherSessions && otherSessions.length > 0) {
          const otherCompany = (otherSessions[0] as any).companies?.name || 'Another company';
          toast({
            title: 'Session Conflict Detected',
            description: `You're already logged into ${otherCompany} in another tab. You've been signed out to prevent data conflicts.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please sign in again.',
            variant: 'destructive',
          });
        }

        // Sign out after a brief delay
        setTimeout(() => {
          signOut();
        }, 3000);

        return false;
      }

      // Update last active timestamp
      await supabase
        .from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', data.id);

      setIsSessionValid(true);
      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return true; // Don't sign out on network errors
    } finally {
      setSessionChecking(false);
    }
  }, [user, profile?.company_id, toast, signOut]);

  // Invalidate current session
  const invalidateSession = useCallback(async () => {
    if (!user || !sessionTokenRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('session_token', sessionTokenRef.current);

      console.log('🔐 Session invalidated');
    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }, [user]);

  // Handle company selection with session management
  const selectCompanyWithSession = useCallback(async (companyId: string) => {
    const session = await createSession(companyId);
    return session !== null;
  }, [createSession]);

  // Set up session validation interval
  useEffect(() => {
    if (user && profile?.company_id && isSessionValid) {
      // Set login timestamp to prevent immediate validation failures
      sessionStorage.setItem('__login_time', Date.now().toString());
      
      // Delay initial validation to allow company selection to complete
      const timeoutId = setTimeout(validateSession, 5000);

      // Set up periodic validation (every 30 seconds)
      validationIntervalRef.current = setInterval(validateSession, 30000);

      return () => {
        clearTimeout(timeoutId);
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
        }
      };
    }
  }, [user, profile?.company_id, validateSession, isSessionValid]);

  // Invalidate session on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionTokenRef.current && user) {
        // Use sendBeacon for reliable cleanup on page unload
        navigator.sendBeacon('/api/invalidate-session', JSON.stringify({
          sessionToken: sessionTokenRef.current,
          userId: user.id
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      invalidateSession();
    };
  }, [user, invalidateSession]);

  return {
    isSessionValid,
    sessionChecking,
    validateSession,
    invalidateSession,
    selectCompanyWithSession,
    sessionToken: sessionTokenRef.current,
    tabId: tabIdRef.current
  };
};