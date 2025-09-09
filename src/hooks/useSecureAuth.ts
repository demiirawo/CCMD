import { useAuth } from '@/hooks/useAuth';
import { useEnhancedDataIsolation } from '@/hooks/useEnhancedDataIsolation';
import { useSecureCompanySwitch } from '@/hooks/useSecureCompanySwitch';
import { useCallback, useEffect } from 'react';

/**
 * Enhanced authentication hook with secure data isolation
 */
export const useSecureAuth = () => {
  const auth = useAuth();
  const { secureStorage, validateDataIntegrity } = useEnhancedDataIsolation({
    companyId: auth.profile?.company_id,
    enableLeakDetection: true,
    enableRuntimeValidation: true,
    enableMemoryMonitoring: true
  });
  const { secureCompanySwitch, validateCompanyContext } = useSecureCompanySwitch();

  // Enhanced sign out with complete data cleanup
  const secureSignOut = useCallback(async () => {
    console.log('🔒 Initiating secure sign out');
    
    // Clear all isolated storage
    const currentCompanyId = auth.profile?.company_id;
    if (currentCompanyId) {
      try {
        // Clear localStorage with validation
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.includes(currentCompanyId) || key.includes('company_'))) {
            localStorage.removeItem(key);
          }
        }

        // Clear sessionStorage with validation
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && key !== '__tab_id' && (key.includes(currentCompanyId) || key.includes('company_'))) {
            sessionStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Error during secure cleanup:', error);
      }
    }

    // Perform standard sign out
    return await auth.signOut();
  }, [auth]);

  // Enhanced company selection with validation
  const secureSelectCompany = useCallback(async (companyId: string) => {
    console.log('🔒 Initiating secure company selection');
    
    // Validate company access first
    const hasAccess = auth.companies.some(company => company.id === companyId);
    if (!hasAccess) {
      return { error: { message: 'No access to selected company' } };
    }

    // Use secure company switch
    const result = await secureCompanySwitch(companyId);
    if (result.success) {
      return { error: null };
    } else {
      return { error: { message: result.error || 'Company switch failed' } };
    }
  }, [auth.companies, secureCompanySwitch]);

  // Validate current session integrity
  const validateSession = useCallback(() => {
    if (!auth.user || !auth.session) {
      return { valid: false, reason: 'No active session' };
    }

    if (!auth.profile?.company_id) {
      return { valid: false, reason: 'No company context' };
    }

    const contextValidation = validateCompanyContext();
    if (!contextValidation.valid) {
      return { 
        valid: false, 
        reason: 'Company context validation failed',
        issues: contextValidation.issues 
      };
    }

    return { valid: true };
  }, [auth.user, auth.session, auth.profile?.company_id, validateCompanyContext]);

  // Monitor for data integrity issues
  useEffect(() => {
    if (auth.profile?.company_id) {
      const interval = setInterval(() => {
        const validation = validateSession();
        if (!validation.valid) {
          console.warn('🚨 Session validation failed:', validation);
          
          // Auto-cleanup on critical issues
          if (validation.reason === 'Company context validation failed') {
            console.log('🔒 Auto-initiating secure sign out due to context issues');
            secureSignOut();
          }
        }
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [auth.profile?.company_id, validateSession, secureSignOut]);

  return {
    ...auth,
    // Enhanced methods
    signOut: secureSignOut,
    selectCompany: secureSelectCompany,
    validateSession,
    // Secure storage access
    secureStorage,
    validateDataIntegrity
  };
};