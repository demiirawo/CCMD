import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedDataIsolation } from '@/hooks/useEnhancedDataIsolation';
import { useSecureCompanySwitch } from '@/hooks/useSecureCompanySwitch';

interface SecureDataContextType {
  validateContext: () => boolean;
  switchCompany: (companyId: string) => Promise<{ success: boolean; error?: string }>;
  isSecure: boolean;
}

const SecureDataContext = createContext<SecureDataContextType | undefined>(undefined);

export const useSecureData = () => {
  const context = useContext(SecureDataContext);
  if (!context) {
    throw new Error('useSecureData must be used within SecureDataProvider');
  }
  return context;
};

interface SecureDataProviderProps {
  children: ReactNode;
  queryClient: QueryClient;
}

/**
 * Secure data provider that ensures company data isolation
 */
export const SecureDataProvider: React.FC<SecureDataProviderProps> = ({ 
  children, 
  queryClient 
}) => {
  const { profile } = useAuth();
  const { validateCompanyContext, secureCompanySwitch } = useSecureCompanySwitch();
  const { validateDataIntegrity } = useEnhancedDataIsolation({
    enableLeakDetection: true,
    enableRuntimeValidation: true,
    enableMemoryMonitoring: true
  });

  // Enhanced query client with automatic data validation
  const secureQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          // Don't retry on data validation errors
          if (error instanceof Error && error.message.includes('Data validation failed')) {
            return false;
          }
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true
      },
      mutations: {
        retry: false // Don't retry mutations
      }
    }
  });

  // Override the query client's methods to add validation
  const originalSetQueryData = secureQueryClient.setQueryData.bind(secureQueryClient);
  secureQueryClient.setQueryData = (queryKey, updater, options) => {
    try {
      const result = originalSetQueryData(queryKey, updater, options);
      
      // Validate the cached data
      if (result && profile?.company_id) {
        const validation = validateDataIntegrity('cache-set', result);
        if (!validation.valid) {
          console.warn('🚨 Removing invalid cached data:', queryKey);
          secureQueryClient.removeQueries({ queryKey });
          return undefined;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error setting query data:', error);
      return undefined;
    }
  };

  // Context validation
  const validateContext = (): boolean => {
    if (!profile?.company_id) {
      console.warn('🚨 No company context available');
      return false;
    }

    const contextValidation = validateCompanyContext();
    if (!contextValidation.valid) {
      console.error('🚨 Company context validation failed:', contextValidation.issues);
      return false;
    }

    return true;
  };

  // Secure company switching
  const switchCompany = async (companyId: string) => {
    console.log('🔄 Initiating secure company switch to:', companyId);
    
    // Clear the secure query client cache
    secureQueryClient.clear();
    
    const result = await secureCompanySwitch(companyId);
    
    if (!result.success) {
      console.error('🚨 Company switch failed:', result.error);
    }
    
    return result;
  };

  // Monitor for company changes and clear cache
  useEffect(() => {
    if (profile?.company_id) {
      console.log('🔄 Company context changed, validating cache');
      
      // Remove any queries that don't belong to current company
      secureQueryClient.removeQueries({
        predicate: (query) => {
          const hasCompanyScope = query.queryKey.some(key => 
            typeof key === 'string' && key.includes('company_')
          );
          
          if (hasCompanyScope) {
            const belongsToCurrentCompany = query.queryKey.some(key => 
              typeof key === 'string' && key.includes(`company_${profile.company_id}`)
            );
            
            return hasCompanyScope && !belongsToCurrentCompany;
          }
          
          return false;
        }
      });
    }
  }, [profile?.company_id, secureQueryClient]);

  const contextValue: SecureDataContextType = {
    validateContext,
    switchCompany,
    isSecure: !!profile?.company_id && validateContext()
  };

  return (
    <SecureDataContext.Provider value={contextValue}>
      <QueryClientProvider client={secureQueryClient}>
        {children}
      </QueryClientProvider>
    </SecureDataContext.Provider>
  );
};