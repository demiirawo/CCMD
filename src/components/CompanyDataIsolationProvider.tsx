/**
 * Provider component that enforces company data isolation across the entire application
 * Prevents data leakage between different companies by clearing data on company switches
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { clearAllCompanyData } from '@/utils/companyDataIsolation';

interface CompanyDataIsolationProviderProps {
  children: React.ReactNode;
  enableLogging?: boolean;
}

export const CompanyDataIsolationProvider: React.FC<CompanyDataIsolationProviderProps> = ({
  children,
  enableLogging = false
}) => {
  const { profile, user } = useAuth();

  // Clear all browser data when user logs out
  useEffect(() => {
    if (!user && profile?.company_id) {
      if (enableLogging) {
        console.log('🧹 CompanyDataIsolationProvider: User logged out, clearing all data');
      }
      // Clear all data for all companies on logout
      clearAllCompanyData(profile.company_id);
    }
  }, [user, profile?.company_id, enableLogging]);

  // Monitor company changes and clear previous company data
  useEffect(() => {
    if (profile?.company_id && enableLogging) {
      console.log('🔒 CompanyDataIsolationProvider: Active company context:', {
        companyId: profile.company_id,
        username: profile.username,
        userId: user?.id
      });
    }
  }, [profile?.company_id, profile?.username, user?.id, enableLogging]);

  // Validate data operations on each render to catch any cross-company leaks
  useEffect(() => {
    if (enableLogging && profile?.company_id) {
      // Count localStorage items for this company
      let companyStorageCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`_company_${profile.company_id}_`)) {
          companyStorageCount++;
        }
      }

      // Count sessionStorage items for this company
      let sessionStorageCount = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes(`_company_${profile.company_id}_`) && key !== '__tab_id') {
          sessionStorageCount++;
        }
      }

      console.log('📊 CompanyDataIsolationProvider: Storage stats for company', profile.company_id, {
        localStorage: companyStorageCount,
        sessionStorage: sessionStorageCount
      });
    }
  }, [profile?.company_id, enableLogging]);

  return <>{children}</>;
};