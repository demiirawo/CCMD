import React, { useEffect } from 'react';
import { useDataIsolation } from '@/hooks/useDataIsolation';
import { useAuth } from '@/hooks/useAuth';

interface DataIsolationWrapperProps {
  children: React.ReactNode;
  enableLogging?: boolean;
}

/**
 * Wrapper component that ensures data isolation and handles company switching
 * Should wrap the main dashboard or any component that handles company-specific data
 */
export const DataIsolationWrapper: React.FC<DataIsolationWrapperProps> = ({ 
  children, 
  enableLogging = false 
}) => {
  const { currentCompanyId } = useDataIsolation();
  const { profile } = useAuth();

  useEffect(() => {
    // Generate or retrieve tab ID on mount
    if (!sessionStorage.getItem('__tab_id')) {
      const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('__tab_id', tabId);
      
      if (enableLogging) {
        console.log('🆔 DataIsolationWrapper: Generated new tab ID:', tabId);
      }
    }
  }, [enableLogging]);

  useEffect(() => {
    if (enableLogging) {
      console.log('🔐 DataIsolationWrapper: Current company context:', {
        companyId: currentCompanyId,
        profileCompanyId: profile?.company_id,
        tabId: sessionStorage.getItem('__tab_id')
      });
    }
  }, [currentCompanyId, profile?.company_id, enableLogging]);

  return <>{children}</>;
};