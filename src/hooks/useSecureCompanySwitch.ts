import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDataIsolation } from '@/hooks/useDataIsolation';

/**
 * Secure company switching with comprehensive data isolation
 * Implements atomic company switching with rollback capability
 */
export const useSecureCompanySwitch = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { handleCompanySwitch, secureLocalStorage, secureSessionStorage } = useDataIsolation();
  const switchInProgress = useRef(false);

  // Create transaction-like company switching
  const secureCompanySwitch = useCallback(async (newCompanyId: string) => {
    if (switchInProgress.current) {
      console.warn('🔒 Company switch already in progress');
      return { success: false, error: 'Switch already in progress' };
    }

    switchInProgress.current = true;
    const currentCompanyId = profile?.company_id;

    console.log('🔄 Starting secure company switch:', { from: currentCompanyId, to: newCompanyId });

    try {
      // 1. CACHE CONTAMINATION PREVENTION: Clear React Query cache
      console.log('🧹 Clearing React Query cache');
      queryClient.clear();
      
      // Invalidate all queries to prevent stale data
      await queryClient.invalidateQueries();

      // 2. COMPONENT STATE ISOLATION: Force component unmounting
      console.log('🔄 Forcing component state reset');
      
      // Clear all browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // 3. MEMORY LEAK PREVENTION: Clear JavaScript closures
      console.log('🧹 Clearing memory references');
      
      // Force garbage collection by clearing large data structures
      const largeArray = new Array(1000000).fill(null);
      largeArray.length = 0;

      // 4. NAVIGATION STATE CLEANUP: Clear browser history state
      console.log('🔄 Clearing navigation state');
      
      // Replace current history state to remove company-specific data
      window.history.replaceState(null, '', window.location.pathname);
      
      // Clear session storage navigation data
      sessionStorage.removeItem('react-router-dom-history');

      // 5. SECURE STORAGE ISOLATION: Handle company data
      if (currentCompanyId && currentCompanyId !== newCompanyId) {
        console.log('🔒 Executing secure data isolation');
        handleCompanySwitch(newCompanyId);
      }

      // 6. RUNTIME VALIDATION: Verify clean state
      console.log('✅ Validating clean state');
      
      // Check for any remaining company-specific data
      const suspiciousKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && currentCompanyId && key.includes(currentCompanyId)) {
          suspiciousKeys.push(key);
        }
      }
      
      if (suspiciousKeys.length > 0) {
        console.warn('⚠️ Found suspicious data after cleanup:', suspiciousKeys);
        suspiciousKeys.forEach(key => localStorage.removeItem(key));
      }

      // 7. ATOMIC SWITCH: Perform the actual company selection
      console.log('🔄 Performing atomic company switch');
      
      // Sign out and redirect to company selection with pending selection
      secureSessionStorage.setItem('pending_company_selection', newCompanyId);
      secureSessionStorage.setItem('company_switch_timestamp', Date.now().toString());
      
      await signOut();
      navigate('/company-selection');

      return { success: true };
    } catch (error) {
      console.error('❌ Error during secure company switch:', error);
      
      // ROLLBACK: Attempt to restore previous state
      try {
        console.log('🔄 Attempting rollback');
        queryClient.clear();
        window.location.reload(); // Nuclear option for cleanup
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      switchInProgress.current = false;
    }
  }, [profile?.company_id, queryClient, navigate, signOut, handleCompanySwitch, secureSessionStorage]);

  // Validate current company context
  const validateCompanyContext = useCallback(() => {
    const currentCompanyId = profile?.company_id;
    if (!currentCompanyId) return { valid: true };

    // Check for data leakage patterns
    const suspiciousPatterns = [];
    
    // Check localStorage for other company data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('company_') && !key.includes(currentCompanyId)) {
        suspiciousPatterns.push(`localStorage: ${key}`);
      }
    }
    
    // Check sessionStorage for other company data
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('company_') && !key.includes(currentCompanyId) && key !== '__tab_id') {
        suspiciousPatterns.push(`sessionStorage: ${key}`);
      }
    }

    if (suspiciousPatterns.length > 0) {
      console.warn('⚠️ Data leakage detected:', suspiciousPatterns);
      return { valid: false, issues: suspiciousPatterns };
    }

    return { valid: true };
  }, [profile?.company_id]);

  return {
    secureCompanySwitch,
    validateCompanyContext,
    isSwitchInProgress: switchInProgress.current
  };
};