import React, { useEffect } from 'react';
import { useDataIsolation } from '@/hooks/useDataIsolation';
import { useSessionManager } from '@/hooks/useSessionManager';
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
  const { isSessionValid, sessionChecking, validateSession } = useSessionManager();
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
      console.log('🔐 DataIsolationWrapper: Session and company context:', {
        companyId: currentCompanyId,
        profileCompanyId: profile?.company_id,
        sessionValid: isSessionValid,
        sessionChecking: sessionChecking,
        tabId: sessionStorage.getItem('__tab_id')
      });
    }
  }, [currentCompanyId, profile?.company_id, isSessionValid, sessionChecking, enableLogging]);

  // Don't render children if session is invalid to prevent data leaks
  if (!isSessionValid && !sessionChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Session Conflict Detected</h2>
          <p className="text-muted-foreground">
            Your session has been terminated due to a conflict with another browser tab.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};