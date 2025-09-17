/**
 * Comprehensive data isolation utility to prevent cross-company data leakage
 * All dashboard data MUST be scoped by company_id and tab_id
 */

import { supabase } from '@/integrations/supabase/client';

interface IsolatedStorageOptions {
  companyId: string;
  tabId?: string;
  userId?: string;
}

interface DatabaseOperationOptions extends IsolatedStorageOptions {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
}

/**
 * Generate a company and tab isolated storage key
 */
export const createIsolatedStorageKey = (baseKey: string, options: IsolatedStorageOptions): string => {
  const { companyId, tabId, userId } = options;
  
  // Ensure we always have a tab ID for isolation
  const effectiveTabId = tabId || sessionStorage.getItem('__tab_id') || `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a compound key that includes company_id for complete isolation
  let isolatedKey = `${baseKey}_company_${companyId}_tab_${effectiveTabId}`;
  
  if (userId) {
    isolatedKey += `_user_${userId}`;
  }
  
  return isolatedKey;
};

/**
 * Company-isolated localStorage operations
 */
export const isolatedLocalStorage = {
  setItem: (key: string, value: string, options: IsolatedStorageOptions): void => {
    const isolatedKey = createIsolatedStorageKey(key, options);
    localStorage.setItem(isolatedKey, value);
    console.log('🔒 CompanyIsolation: localStorage.setItem with key:', isolatedKey);
  },
  
  getItem: (key: string, options: IsolatedStorageOptions): string | null => {
    const isolatedKey = createIsolatedStorageKey(key, options);
    return localStorage.getItem(isolatedKey);
  },
  
  removeItem: (key: string, options: IsolatedStorageOptions): void => {
    const isolatedKey = createIsolatedStorageKey(key, options);
    localStorage.removeItem(isolatedKey);
  },
  
  // Clear all data for a specific company
  clearCompanyData: (companyId: string): void => {
    console.log('🧹 CompanyIsolation: Clearing all localStorage data for company:', companyId);
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`_company_${companyId}_`)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🧹 CompanyIsolation: Removed localStorage keys:', keysToRemove);
  }
};

/**
 * Company-isolated sessionStorage operations
 */
export const isolatedSessionStorage = {
  setItem: (key: string, value: string, options: IsolatedStorageOptions): void => {
    const isolatedKey = createIsolatedStorageKey(key, options);
    sessionStorage.setItem(isolatedKey, value);
    console.log('🔒 CompanyIsolation: sessionStorage.setItem with key:', isolatedKey);
  },
  
  getItem: (key: string, options: IsolatedStorageOptions): string | null => {
    const isolatedKey = createIsolatedStorageKey(key, options);
    return sessionStorage.getItem(isolatedKey);
  },
  
  removeItem: (key: string, options: IsolatedStorageOptions): void => {
    const isolatedKey = createIsolatedStorageKey(key, options);
    sessionStorage.removeItem(isolatedKey);
  },
  
  // Clear all data for a specific company (except tab_id)
  clearCompanyData: (companyId: string): void => {
    console.log('🧹 CompanyIsolation: Clearing all sessionStorage data for company:', companyId);
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes(`_company_${companyId}_`) && key !== '__tab_id') {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log('🧹 CompanyIsolation: Removed sessionStorage keys:', keysToRemove);
  }
};

/**
 * Company-isolated database operations
 * Ensures all operations include company_id filtering
 */
export const isolatedDatabase = {
  /**
   * Select data with company_id filtering
   */
  select: async (table: string, companyId: string, additionalFilters?: Record<string, any>) => {
    console.log(`🔒 CompanyIsolation: Database SELECT from ${table} for company ${companyId}`);
    
    let query = (supabase as any).from(table).select('*').eq('company_id', companyId);
    
    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    return await query;
  },
  
  /**
   * Insert data with company_id automatically added
   */
  insert: async (table: string, data: any, companyId: string) => {
    console.log(`🔒 CompanyIsolation: Database INSERT to ${table} for company ${companyId}`);
    
    const dataWithCompanyId = {
      ...data,
      company_id: companyId
    };
    
    return await (supabase as any).from(table).insert(dataWithCompanyId).select();
  },
  
  /**
   * Update data with company_id filtering for security
   */
  update: async (table: string, data: any, companyId: string, filters: Record<string, any>) => {
    console.log(`🔒 CompanyIsolation: Database UPDATE in ${table} for company ${companyId}`);
    
    let query = (supabase as any).from(table).update(data).eq('company_id', companyId);
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    return await query.select();
  },
  
  /**
   * Upsert data with company_id automatically added and filtered
   */
  upsert: async (table: string, data: any, companyId: string) => {
    console.log(`🔒 CompanyIsolation: Database UPSERT to ${table} for company ${companyId}`);
    
    const dataWithCompanyId = {
      ...data,
      company_id: companyId
    };
    
    return await (supabase as any).from(table).upsert(dataWithCompanyId).select();
  },
  
  /**
   * Delete data with company_id filtering for security
   */
  delete: async (table: string, companyId: string, filters: Record<string, any>) => {
    console.log(`🔒 CompanyIsolation: Database DELETE from ${table} for company ${companyId}`);
    
    let query = (supabase as any).from(table).delete().eq('company_id', companyId);
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    return await query;
  }
};

/**
 * Validate that data operations are within the correct company context
 */
export const validateCompanyAccess = (
  currentCompanyId: string | null | undefined,
  dataCompanyId: string | null | undefined,
  operation: string
): boolean => {
  if (!currentCompanyId) {
    console.error('🚨 CompanyIsolation: No current company context');
    return false;
  }

  if (dataCompanyId && dataCompanyId !== currentCompanyId) {
    console.error('🚨 CompanyIsolation: Cross-company data access blocked', {
      current: currentCompanyId,
      attempted: dataCompanyId,
      operation
    });
    return false;
  }

  return true;
};

/**
 * Clear all data for a company across localStorage and sessionStorage
 */
export const clearAllCompanyData = (companyId: string): void => {
  console.log('🧹 CompanyIsolation: Clearing ALL data for company:', companyId);
  
  isolatedLocalStorage.clearCompanyData(companyId);
  isolatedSessionStorage.clearCompanyData(companyId);
  
  console.log('🧹 CompanyIsolation: Company data cleanup completed for:', companyId);
};

/**
 * Get or create a tab ID for session isolation
 */
export const getTabId = (): string => {
  let tabId = sessionStorage.getItem('__tab_id');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('__tab_id', tabId);
    console.log('🆔 CompanyIsolation: Generated new tab ID:', tabId);
  }
  return tabId;
};