/**
 * Utility functions for data isolation between companies and browser tabs
 */

// Generate or get existing tab ID
export const getTabId = (): string => {
  let tabId = sessionStorage.getItem('__tab_id');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('__tab_id', tabId);
  }
  return tabId;
};

// Create company and tab scoped storage key
export const createIsolatedKey = (baseKey: string, companyId?: string): string => {
  const tabId = getTabId();
  if (companyId) {
    return `${baseKey}_${companyId}_${tabId}`;
  }
  return `${baseKey}_${tabId}`;
};

// Clear all data for a specific company
export const clearCompanyData = (companyId: string): void => {
  console.log('🧹 DataIsolation: Clearing all data for company:', companyId);

  // Clear localStorage
  const localKeysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(companyId)) {
      localKeysToRemove.push(key);
    }
  }
  localKeysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear sessionStorage (except tab ID)
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes(companyId) && key !== '__tab_id') {
      sessionKeysToRemove.push(key);
    }
  }
  sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

  console.log('🧹 DataIsolation: Cleared keys:', {
    localStorage: localKeysToRemove,
    sessionStorage: sessionKeysToRemove
  });
};

// Validate data operation against company context
export const validateCompanyAccess = (
  currentCompanyId: string | null | undefined,
  dataCompanyId: string | null | undefined,
  operation: string
): boolean => {
  if (!currentCompanyId) {
    console.warn('⚠️ DataIsolation: No current company context');
    return false;
  }

  if (dataCompanyId && dataCompanyId !== currentCompanyId) {
    console.error('🚨 DataIsolation: Cross-company data access blocked', {
      current: currentCompanyId,
      attempted: dataCompanyId,
      operation
    });
    return false;
  }

  return true;
};

// Safe localStorage operations
export const isolatedLocalStorage = {
  setItem: (key: string, value: string, companyId?: string): void => {
    const isolatedKey = createIsolatedKey(key, companyId);
    localStorage.setItem(isolatedKey, value);
    console.log('💾 Isolated localStorage.setItem:', isolatedKey);
  },

  getItem: (key: string, companyId?: string): string | null => {
    const isolatedKey = createIsolatedKey(key, companyId);
    return localStorage.getItem(isolatedKey);
  },

  removeItem: (key: string, companyId?: string): void => {
    const isolatedKey = createIsolatedKey(key, companyId);
    localStorage.removeItem(isolatedKey);
  }
};

// Safe sessionStorage operations
export const isolatedSessionStorage = {
  setItem: (key: string, value: string, companyId?: string): void => {
    const isolatedKey = createIsolatedKey(key, companyId);
    sessionStorage.setItem(isolatedKey, value);
    console.log('💾 Isolated sessionStorage.setItem:', isolatedKey);
  },

  getItem: (key: string, companyId?: string): string | null => {
    const isolatedKey = createIsolatedKey(key, companyId);
    return sessionStorage.getItem(isolatedKey);
  },

  removeItem: (key: string, companyId?: string): void => {
    const isolatedKey = createIsolatedKey(key, companyId);
    sessionStorage.removeItem(isolatedKey);
  }
};