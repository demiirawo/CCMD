/**
 * React hook for company-isolated data operations
 * Ensures all data is properly scoped by company_id to prevent cross-company leakage
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { 
  isolatedLocalStorage, 
  isolatedSessionStorage, 
  isolatedDatabase, 
  validateCompanyAccess, 
  clearAllCompanyData, 
  getTabId 
} from '@/utils/companyDataIsolation';

interface CompanyDataIsolationConfig {
  enableLogging?: boolean;
  autoSaveDelay?: number;
}

export const useCompanyDataIsolation = ({ 
  enableLogging = false, 
  autoSaveDelay = 2000 
}: CompanyDataIsolationConfig = {}) => {
  const { profile, user } = useAuth();
  const previousCompanyIdRef = useRef<string | null>(null);
  const tabId = getTabId();

  // Track company changes and clear previous company data
  useEffect(() => {
    const currentCompanyId = profile?.company_id;
    const previousCompanyId = previousCompanyIdRef.current;

    if (enableLogging) {
      console.log('🔄 CompanyDataIsolation: Company change detected', {
        previous: previousCompanyId,
        current: currentCompanyId,
        profile: profile?.username
      });
    }

    // If company changed and we had a previous company, clear its data
    if (previousCompanyId && currentCompanyId && previousCompanyId !== currentCompanyId) {
      if (enableLogging) {
        console.log('🧹 CompanyDataIsolation: Clearing previous company data:', previousCompanyId);
      }
      clearAllCompanyData(previousCompanyId);
    }

    // Update the ref
    previousCompanyIdRef.current = currentCompanyId;
  }, [profile?.company_id, enableLogging]);

  // Isolated localStorage operations
  const localStorageOps = {
    setItem: (key: string, value: any): boolean => {
      if (!profile?.company_id) {
        console.warn('🚨 CompanyDataIsolation: Cannot save to localStorage - no company context');
        return false;
      }

      try {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        isolatedLocalStorage.setItem(key, serializedValue, {
          companyId: profile.company_id,
          tabId,
          userId: user?.id
        });
        return true;
      } catch (error) {
        console.error('❌ CompanyDataIsolation: localStorage.setItem failed:', error);
        return false;
      }
    },

    getItem: <T = any>(key: string, defaultValue?: T): T | null => {
      if (!profile?.company_id) {
        if (enableLogging) {
          console.warn('🚨 CompanyDataIsolation: Cannot read from localStorage - no company context');
        }
        return defaultValue || null;
      }

      try {
        const value = isolatedLocalStorage.getItem(key, {
          companyId: profile.company_id,
          tabId,
          userId: user?.id
        });

        if (value === null) return defaultValue || null;
        
        try {
          return JSON.parse(value);
        } catch {
          return value as T;
        }
      } catch (error) {
        console.error('❌ CompanyDataIsolation: localStorage.getItem failed:', error);
        return defaultValue || null;
      }
    },

    removeItem: (key: string): boolean => {
      if (!profile?.company_id) {
        console.warn('🚨 CompanyDataIsolation: Cannot remove from localStorage - no company context');
        return false;
      }

      try {
        isolatedLocalStorage.removeItem(key, {
          companyId: profile.company_id,
          tabId,
          userId: user?.id
        });
        return true;
      } catch (error) {
        console.error('❌ CompanyDataIsolation: localStorage.removeItem failed:', error);
        return false;
      }
    }
  };

  // Isolated sessionStorage operations
  const sessionStorageOps = {
    setItem: (key: string, value: any): boolean => {
      if (!profile?.company_id) {
        console.warn('🚨 CompanyDataIsolation: Cannot save to sessionStorage - no company context');
        return false;
      }

      try {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        isolatedSessionStorage.setItem(key, serializedValue, {
          companyId: profile.company_id,
          tabId,
          userId: user?.id
        });
        return true;
      } catch (error) {
        console.error('❌ CompanyDataIsolation: sessionStorage.setItem failed:', error);
        return false;
      }
    },

    getItem: <T = any>(key: string, defaultValue?: T): T | null => {
      if (!profile?.company_id) {
        if (enableLogging) {
          console.warn('🚨 CompanyDataIsolation: Cannot read from sessionStorage - no company context');
        }
        return defaultValue || null;
      }

      try {
        const value = isolatedSessionStorage.getItem(key, {
          companyId: profile.company_id,
          tabId,
          userId: user?.id
        });

        if (value === null) return defaultValue || null;
        
        try {
          return JSON.parse(value);
        } catch {
          return value as T;
        }
      } catch (error) {
        console.error('❌ CompanyDataIsolation: sessionStorage.getItem failed:', error);
        return defaultValue || null;
      }
    },

    removeItem: (key: string): boolean => {
      if (!profile?.company_id) {
        console.warn('🚨 CompanyDataIsolation: Cannot remove from sessionStorage - no company context');
        return false;
      }

      try {
        isolatedSessionStorage.removeItem(key, {
          companyId: profile.company_id,
          tabId,
          userId: user?.id
        });
        return true;
      } catch (error) {
        console.error('❌ CompanyDataIsolation: sessionStorage.removeItem failed:', error);
        return false;
      }
    }
  };

  // Isolated database operations
  const databaseOps = {
    select: async (table: string, additionalFilters?: Record<string, any>) => {
      if (!profile?.company_id) {
        throw new Error('Cannot perform database operation - no company context');
      }

      return isolatedDatabase.select(table, profile.company_id, additionalFilters);
    },

    insert: async (table: string, data: any) => {
      if (!profile?.company_id) {
        throw new Error('Cannot perform database operation - no company context');
      }

      return isolatedDatabase.insert(table, data, profile.company_id);
    },

    update: async (table: string, data: any, filters: Record<string, any>) => {
      if (!profile?.company_id) {
        throw new Error('Cannot perform database operation - no company context');
      }

      return isolatedDatabase.update(table, data, profile.company_id, filters);
    },

    upsert: async (table: string, data: any) => {
      if (!profile?.company_id) {
        throw new Error('Cannot perform database operation - no company context');
      }

      return isolatedDatabase.upsert(table, data, profile.company_id);
    },

    delete: async (table: string, filters: Record<string, any>) => {
      if (!profile?.company_id) {
        throw new Error('Cannot perform database operation - no company context');
      }

      return isolatedDatabase.delete(table, profile.company_id, filters);
    }
  };

  // Validation function
  const validateAccess = useCallback((dataCompanyId: string | null | undefined, operation: string): boolean => {
    return validateCompanyAccess(profile?.company_id, dataCompanyId, operation);
  }, [profile?.company_id]);

  // Manual cleanup function
  const clearCurrentCompanyData = useCallback(() => {
    if (profile?.company_id) {
      clearAllCompanyData(profile.company_id);
    }
  }, [profile?.company_id]);

  return {
    localStorage: localStorageOps,
    sessionStorage: sessionStorageOps,
    database: databaseOps,
    validateAccess,
    clearCurrentCompanyData,
    currentCompanyId: profile?.company_id,
    tabId,
    isReady: !!profile?.company_id
  };
};