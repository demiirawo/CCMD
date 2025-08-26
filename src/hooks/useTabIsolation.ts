import { useEffect, useRef } from 'react';

interface TabIsolationConfig {
  companyId?: string;
  enableLogging?: boolean;
}

/**
 * Hook for managing tab-isolated data storage
 * Prevents data leakage between different browser tabs and company contexts
 */
export const useTabIsolation = ({ companyId, enableLogging = false }: TabIsolationConfig = {}) => {
  const tabIdRef = useRef<string>('');

  // Generate unique tab ID on mount
  useEffect(() => {
    if (!tabIdRef.current) {
      // Generate unique tab identifier that persists for the tab's lifetime
      tabIdRef.current = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store tab ID in sessionStorage (tab-specific)
      sessionStorage.setItem('__tab_id', tabIdRef.current);
      
      if (enableLogging) {
        console.log('🆔 TabIsolation: Generated tab ID:', tabIdRef.current);
      }
    }
  }, [enableLogging]);

  // Create scoped storage key
  const createScopedKey = (baseKey: string, additionalCompanyId?: string): string => {
    const effectiveCompanyId = additionalCompanyId || companyId;
    const tabId = tabIdRef.current || sessionStorage.getItem('__tab_id') || 'unknown';
    
    if (effectiveCompanyId) {
      return `${baseKey}_${effectiveCompanyId}_${tabId}`;
    }
    return `${baseKey}_${tabId}`;
  };

  // Clear all company-specific data immediately
  const clearCompanyData = (targetCompanyId?: string) => {
    const effectiveCompanyId = targetCompanyId || companyId;
    if (!effectiveCompanyId) return;

    if (enableLogging) {
      console.log('🧹 TabIsolation: Clearing company data for:', effectiveCompanyId);
    }

    // Clear localStorage items for this company
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(effectiveCompanyId)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear sessionStorage items for this company (tab-specific)
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes(effectiveCompanyId) && key !== '__tab_id') {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

    if (enableLogging) {
      console.log('🧹 TabIsolation: Cleared keys:', { localStorage: keysToRemove, sessionStorage: sessionKeysToRemove });
    }
  };

  // Isolated localStorage operations
  const isolatedLocalStorage = {
    setItem: (key: string, value: string, targetCompanyId?: string) => {
      const scopedKey = createScopedKey(key, targetCompanyId);
      localStorage.setItem(scopedKey, value);
      
      if (enableLogging) {
        console.log('💾 TabIsolation: localStorage.setItem:', scopedKey);
      }
    },
    
    getItem: (key: string, targetCompanyId?: string): string | null => {
      const scopedKey = createScopedKey(key, targetCompanyId);
      const value = localStorage.getItem(scopedKey);
      
      if (enableLogging && value) {
        console.log('📖 TabIsolation: localStorage.getItem:', scopedKey);
      }
      
      return value;
    },
    
    removeItem: (key: string, targetCompanyId?: string) => {
      const scopedKey = createScopedKey(key, targetCompanyId);
      localStorage.removeItem(scopedKey);
      
      if (enableLogging) {
        console.log('🗑️ TabIsolation: localStorage.removeItem:', scopedKey);
      }
    }
  };

  // Isolated sessionStorage operations
  const isolatedSessionStorage = {
    setItem: (key: string, value: string, targetCompanyId?: string) => {
      const scopedKey = createScopedKey(key, targetCompanyId);
      sessionStorage.setItem(scopedKey, value);
      
      if (enableLogging) {
        console.log('💾 TabIsolation: sessionStorage.setItem:', scopedKey);
      }
    },
    
    getItem: (key: string, targetCompanyId?: string): string | null => {
      const scopedKey = createScopedKey(key, targetCompanyId);
      const value = sessionStorage.getItem(scopedKey);
      
      if (enableLogging && value) {
        console.log('📖 TabIsolation: sessionStorage.getItem:', scopedKey);
      }
      
      return value;
    },
    
    removeItem: (key: string, targetCompanyId?: string) => {
      const scopedKey = createScopedKey(key, targetCompanyId);
      sessionStorage.removeItem(scopedKey);
      
      if (enableLogging) {
        console.log('🗑️ TabIsolation: sessionStorage.removeItem:', scopedKey);
      }
    }
  };

  return {
    tabId: tabIdRef.current,
    createScopedKey,
    clearCompanyData,
    isolatedLocalStorage,
    isolatedSessionStorage
  };
};