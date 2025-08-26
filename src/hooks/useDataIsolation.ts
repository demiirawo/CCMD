import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useTabIsolation } from './useTabIsolation';

interface DataOperation {
  table: string;
  operation: 'read' | 'write' | 'delete';
  data?: any;
  companyId?: string;
}

/**
 * Hook for enforcing data isolation between companies and browser tabs
 * Prevents cross-company data contamination and ensures secure data operations
 */
export const useDataIsolation = () => {
  const { profile, user } = useAuth();
  const { clearCompanyData, isolatedLocalStorage, isolatedSessionStorage } = useTabIsolation({
    companyId: profile?.company_id,
    enableLogging: true
  });
  
  const previousCompanyId = useRef<string | null>(null);

  // Track company changes and clear data immediately
  useEffect(() => {
    const currentCompanyId = profile?.company_id || null;
    
    if (previousCompanyId.current !== null && 
        previousCompanyId.current !== currentCompanyId) {
      console.log('🔄 DataIsolation: Company changed, clearing previous data', {
        from: previousCompanyId.current,
        to: currentCompanyId
      });
      
      // Clear data from previous company immediately
      if (previousCompanyId.current) {
        clearCompanyData(previousCompanyId.current);
      }
    }
    
    previousCompanyId.current = currentCompanyId;
  }, [profile?.company_id, clearCompanyData]);

  // Validate data operation against current company context
  const validateDataOperation = useCallback((operation: DataOperation): boolean => {
    const currentCompanyId = profile?.company_id;
    const operationCompanyId = operation.companyId || operation.data?.company_id;

    if (!currentCompanyId) {
      console.warn('⚠️ DataIsolation: No current company context');
      return false;
    }

    if (operationCompanyId && operationCompanyId !== currentCompanyId) {
      console.error('🚨 DataIsolation: Cross-company data access attempt blocked', {
        current: currentCompanyId,
        attempted: operationCompanyId,
        operation: operation.operation,
        table: operation.table
      });
      return false;
    }

    return true;
  }, [profile?.company_id]);

  // Enhanced local storage with company validation
  const secureLocalStorage = {
    setItem: (key: string, value: any) => {
      if (!profile?.company_id) {
        console.warn('⚠️ DataIsolation: Cannot save to localStorage without company context');
        return;
      }
      
      const dataWithMetadata = {
        data: value,
        companyId: profile.company_id,
        userId: user?.id,
        timestamp: Date.now()
      };
      
      isolatedLocalStorage.setItem(key, JSON.stringify(dataWithMetadata));
    },
    
    getItem: (key: string): any | null => {
      if (!profile?.company_id) {
        console.warn('⚠️ DataIsolation: Cannot read from localStorage without company context');
        return null;
      }
      
      const rawValue = isolatedLocalStorage.getItem(key);
      if (!rawValue) return null;
      
      try {
        const parsed = JSON.parse(rawValue);
        
        // Validate company context
        if (parsed.companyId !== profile.company_id) {
          console.warn('⚠️ DataIsolation: Cross-company localStorage access blocked', {
            stored: parsed.companyId,
            current: profile.company_id
          });
          return null;
        }
        
        return parsed.data;
      } catch (error) {
        console.error('❌ DataIsolation: Error parsing localStorage data:', error);
        return null;
      }
    },
    
    removeItem: (key: string) => {
      isolatedLocalStorage.removeItem(key);
    }
  };

  // Enhanced session storage with company validation
  const secureSessionStorage = {
    setItem: (key: string, value: any) => {
      if (!profile?.company_id) {
        console.warn('⚠️ DataIsolation: Cannot save to sessionStorage without company context');
        return;
      }
      
      const dataWithMetadata = {
        data: value,
        companyId: profile.company_id,
        userId: user?.id,
        timestamp: Date.now()
      };
      
      isolatedSessionStorage.setItem(key, JSON.stringify(dataWithMetadata));
    },
    
    getItem: (key: string): any | null => {
      if (!profile?.company_id) {
        console.warn('⚠️ DataIsolation: Cannot read from sessionStorage without company context');
        return null;
      }
      
      const rawValue = isolatedSessionStorage.getItem(key);
      if (!rawValue) return null;
      
      try {
        const parsed = JSON.parse(rawValue);
        
        // Validate company context
        if (parsed.companyId !== profile.company_id) {
          console.warn('⚠️ DataIsolation: Cross-company sessionStorage access blocked', {
            stored: parsed.companyId,
            current: profile.company_id
          });
          return null;
        }
        
        return parsed.data;
      } catch (error) {
        console.error('❌ DataIsolation: Error parsing sessionStorage data:', error);
        return null;
      }
    },
    
    removeItem: (key: string) => {
      isolatedSessionStorage.removeItem(key);
    }
  };

  // Immediate company switch handler
  const handleCompanySwitch = useCallback((newCompanyId: string) => {
    console.log('🔄 DataIsolation: Handling immediate company switch', {
      from: profile?.company_id,
      to: newCompanyId
    });
    
    // Clear all data immediately
    if (profile?.company_id) {
      clearCompanyData(profile.company_id);
    }
    
    // Force reload of page state after brief delay to ensure clean slate
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, [profile?.company_id, clearCompanyData]);

  return {
    validateDataOperation,
    secureLocalStorage,
    secureSessionStorage,
    handleCompanySwitch,
    currentCompanyId: profile?.company_id || null
  };
};