import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook that forces component remount when company changes
 * This prevents data leakage between company accounts
 */
export const useCompanySwitchReset = () => {
  const { profile } = useAuth();
  const previousCompanyId = useRef<string | null>(null);
  const mountKey = useRef<number>(0);

  useEffect(() => {
    const currentCompanyId = profile?.company_id || null;
    
    // If company has changed (and it's not the initial load)
    if (previousCompanyId.current !== null && previousCompanyId.current !== currentCompanyId) {
      console.log('🔄 CompanySwitchReset: Company changed, forcing remount', {
        previous: previousCompanyId.current,
        current: currentCompanyId
      });
      
      // Increment mount key to force remount
      mountKey.current += 1;
      
      // Note: We don't reload the page here anymore as selectCompany 
      // already handles data clearing and state updates
    }
    
    previousCompanyId.current = currentCompanyId;
  }, [profile?.company_id]);

  return mountKey.current;
};