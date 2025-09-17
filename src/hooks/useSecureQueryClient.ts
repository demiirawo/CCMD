import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Secure query client with company-aware cache management
 */
export const useSecureQueryClient = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const queryKeyPrefix = useRef<string>('');

  // Create company-scoped query keys
  const createSecureQueryKey = useCallback((baseKey: QueryKey): QueryKey => {
    const companyId = profile?.company_id;
    if (!companyId) return baseKey;

    // Ensure query keys are company-specific
    const secureKey = Array.isArray(baseKey) ? [...baseKey] : [baseKey];
    
    // Add company prefix if not already present
    if (!secureKey.some(key => typeof key === 'string' && key.includes(companyId))) {
      secureKey.unshift(`company_${companyId}`);
    }

    return secureKey;
  }, [profile?.company_id]);

  // Secure query methods with company validation
  const secureQuery = {
    // Get data with company validation
    getQueryData: <T = unknown>(queryKey: QueryKey): T | undefined => {
      const secureKey = createSecureQueryKey(queryKey);
      const data = queryClient.getQueryData<T>(secureKey);
      
      // Validate that data belongs to current company
      if (data && profile?.company_id) {
        const dataString = JSON.stringify(data);
        const currentCompanyId = profile.company_id;
        
        // Check for foreign company IDs in data
        const companyIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
        const foundIds = dataString.match(companyIdPattern) || [];
        const foreignIds = foundIds.filter(id => id !== currentCompanyId);
        
        if (foreignIds.length > 0) {
          console.warn('🚨 Foreign company data detected in cache, removing:', {
            queryKey: secureKey,
            foreignCompanies: foreignIds
          });
          queryClient.removeQueries({ queryKey: secureKey });
          return undefined;
        }
      }
      
      return data;
    },

    // Set data with company validation
    setQueryData: <T>(queryKey: QueryKey, data: T): T | undefined => {
      const secureKey = createSecureQueryKey(queryKey);
      
      // Validate data before caching
      if (data && profile?.company_id) {
        const dataString = JSON.stringify(data);
        const currentCompanyId = profile.company_id;
        
        // Check for foreign company IDs
        const companyIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
        const foundIds = dataString.match(companyIdPattern) || [];
        const foreignIds = foundIds.filter(id => id !== currentCompanyId);
        
        if (foreignIds.length > 0) {
          console.error('🚨 Attempted to cache data with foreign company IDs:', {
            queryKey: secureKey,
            foreignCompanies: foreignIds
          });
          throw new Error('Data validation failed: foreign company data detected');
        }
      }
      
      return queryClient.setQueryData(secureKey, data);
    },

    // Invalidate queries with company scope
    invalidateQueries: (queryKey?: QueryKey) => {
      if (queryKey) {
        const secureKey = createSecureQueryKey(queryKey);
        return queryClient.invalidateQueries({ queryKey: secureKey });
      } else {
        // Invalidate all queries for current company
        const companyId = profile?.company_id;
        if (companyId) {
          return queryClient.invalidateQueries({
            predicate: (query) => {
              return query.queryKey.some(key => 
                typeof key === 'string' && key.includes(`company_${companyId}`)
              );
            }
          });
        }
      }
    },

    // Remove queries with company scope
    removeQueries: (queryKey?: QueryKey) => {
      if (queryKey) {
        const secureKey = createSecureQueryKey(queryKey);
        return queryClient.removeQueries({ queryKey: secureKey });
      } else {
        // Remove all queries for current company
        const companyId = profile?.company_id;
        if (companyId) {
          return queryClient.removeQueries({
            predicate: (query) => {
              return query.queryKey.some(key => 
                typeof key === 'string' && key.includes(`company_${companyId}`)
              );
            }
          });
        }
      }
    }
  };

  // Clear cache for specific company (for company switching)
  const clearCompanyCache = useCallback((companyId: string) => {
    console.log('🧹 Clearing React Query cache for company:', companyId);
    
    queryClient.removeQueries({
      predicate: (query) => {
        return query.queryKey.some(key => 
          typeof key === 'string' && key.includes(`company_${companyId}`)
        );
      }
    });
  }, [queryClient]);

  // Audit cache for cross-company contamination
  const auditCache = useCallback(() => {
    const currentCompanyId = profile?.company_id;
    if (!currentCompanyId) return { clean: true };

    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const contaminations = [];

    for (const query of queries) {
      const queryKey = query.queryKey;
      const data = query.state.data;
      
      // Check if query key belongs to current company
      const belongsToCurrentCompany = queryKey.some(key => 
        typeof key === 'string' && key.includes(`company_${currentCompanyId}`)
      );
      
      if (!belongsToCurrentCompany) {
        // Check if it contains any company ID
        const hasCompanyId = queryKey.some(key => 
          typeof key === 'string' && key.includes('company_')
        );
        
        if (hasCompanyId) {
          contaminations.push({
            queryKey,
            reason: 'Foreign company query key'
          });
        }
      }
      
      // Check data for foreign company IDs
      if (data) {
        const dataString = JSON.stringify(data);
        const companyIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
        const foundIds = dataString.match(companyIdPattern) || [];
        const foreignIds = foundIds.filter(id => id !== currentCompanyId);
        
        if (foreignIds.length > 0) {
          contaminations.push({
            queryKey,
            reason: 'Foreign company data',
            foreignCompanies: foreignIds
          });
        }
      }
    }

    if (contaminations.length > 0) {
      console.warn('🚨 Cache contamination detected:', contaminations);
      return { clean: false, contaminations };
    }

    return { clean: true };
  }, [profile?.company_id, queryClient]);

  return {
    queryClient,
    secureQuery,
    createSecureQueryKey,
    clearCompanyCache,
    auditCache,
    currentCompanyId: profile?.company_id
  };
};