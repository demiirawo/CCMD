import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTabIsolation } from '@/hooks/useTabIsolation';

interface DataLeakDetection {
  enabled: boolean;
  alertOnDetection: boolean;
  autoCleanup: boolean;
}

interface EnhancedIsolationConfig {
  companyId?: string;
  enableLeakDetection?: boolean;
  enableRuntimeValidation?: boolean;
  enableMemoryMonitoring?: boolean;
  leakDetection?: DataLeakDetection;
}

/**
 * Enhanced data isolation with runtime validation and leak detection
 */
export const useEnhancedDataIsolation = (config: EnhancedIsolationConfig = {}) => {
  const { profile } = useAuth();
  const { tabId, isolatedLocalStorage, isolatedSessionStorage, clearCompanyData } = useTabIsolation({
    companyId: config.companyId || profile?.company_id,
    enableLogging: true
  });

  const previousCompanyId = useRef<string | null>(null);
  const memoryReferences = useRef(new Set<any>());
  const leakDetectionTimer = useRef<NodeJS.Timeout>();

  // Runtime data validation
  const validateDataIntegrity = useCallback((operation: string, data: any) => {
    if (!config.enableRuntimeValidation) return { valid: true };

    const currentCompanyId = config.companyId || profile?.company_id;
    
    // Check if data contains references to other companies
    const dataString = JSON.stringify(data);
    const companyIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
    const foundIds = dataString.match(companyIdPattern) || [];
    
    const foreignCompanyIds = foundIds.filter(id => id !== currentCompanyId);
    
    if (foreignCompanyIds.length > 0) {
      console.error(`🚨 Data integrity violation in ${operation}:`, {
        currentCompany: currentCompanyId,
        foreignCompanies: foreignCompanyIds,
        data: data
      });
      return { valid: false, violations: foreignCompanyIds };
    }

    return { valid: true };
  }, [config.companyId, config.enableRuntimeValidation, profile?.company_id]);

  // Memory leak detection
  const detectMemoryLeaks = useCallback(() => {
    if (!config.enableMemoryMonitoring) return { leaksDetected: false };

    const currentCompanyId = config.companyId || profile?.company_id;
    const memoryLeaks = [];

    // Check performance memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        memoryLeaks.push('High memory usage detected');
      }
    }

    // Check for excessive stored references
    if (memoryReferences.current.size > 1000) {
      memoryLeaks.push('Excessive memory references detected');
    }

    // Check DOM for company-specific data attributes
    const elementsWithCompanyData = document.querySelectorAll('[data-company-id]');
    const foreignCompanyElements = Array.from(elementsWithCompanyData).filter(
      el => el.getAttribute('data-company-id') !== currentCompanyId
    );

    if (foreignCompanyElements.length > 0) {
      memoryLeaks.push(`DOM elements with foreign company data: ${foreignCompanyElements.length}`);
    }

    if (memoryLeaks.length > 0) {
      console.warn('🔍 Memory leaks detected:', memoryLeaks);
      return { leaksDetected: true, leaks: memoryLeaks };
    }

    return { leaksDetected: false };
  }, [config.companyId, config.enableMemoryMonitoring, profile?.company_id]);

  // Enhanced storage with validation
  const secureStorage = {
    localStorage: {
      setItem: (key: string, value: any) => {
        const validation = validateDataIntegrity('localStorage.setItem', { key, value });
        if (!validation.valid) {
          throw new Error(`Data validation failed for key: ${key}`);
        }
        
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        isolatedLocalStorage.setItem(key, stringValue);
        
        // Add to memory references for monitoring
        if (config.enableMemoryMonitoring) {
          memoryReferences.current.add({ type: 'localStorage', key, timestamp: Date.now() });
        }
      },
      
      getItem: (key: string) => {
        const value = isolatedLocalStorage.getItem(key);
        if (value) {
          const validation = validateDataIntegrity('localStorage.getItem', { key, value });
          if (!validation.valid && config.leakDetection?.autoCleanup) {
            console.warn('🧹 Auto-cleaning invalid data:', key);
            isolatedLocalStorage.removeItem(key);
            return null;
          }
        }
        return value;
      },
      
      removeItem: (key: string) => {
        isolatedLocalStorage.removeItem(key);
        // Remove from memory references
        if (config.enableMemoryMonitoring) {
          memoryReferences.current.forEach(ref => {
            if (typeof ref === 'object' && ref.key === key) {
              memoryReferences.current.delete(ref);
            }
          });
        }
      }
    },
    
    sessionStorage: {
      setItem: (key: string, value: any) => {
        const validation = validateDataIntegrity('sessionStorage.setItem', { key, value });
        if (!validation.valid) {
          throw new Error(`Data validation failed for key: ${key}`);
        }
        
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        isolatedSessionStorage.setItem(key, stringValue);
        
        if (config.enableMemoryMonitoring) {
          memoryReferences.current.add({ type: 'sessionStorage', key, timestamp: Date.now() });
        }
      },
      
      getItem: (key: string) => {
        const value = isolatedSessionStorage.getItem(key);
        if (value) {
          const validation = validateDataIntegrity('sessionStorage.getItem', { key, value });
          if (!validation.valid && config.leakDetection?.autoCleanup) {
            console.warn('🧹 Auto-cleaning invalid session data:', key);
            isolatedSessionStorage.removeItem(key);
            return null;
          }
        }
        return value;
      },
      
      removeItem: (key: string) => {
        isolatedSessionStorage.removeItem(key);
        if (config.enableMemoryMonitoring) {
          memoryReferences.current.forEach(ref => {
            if (typeof ref === 'object' && ref.key === key) {
              memoryReferences.current.delete(ref);
            }
          });
        }
      }
    }
  };

  // Comprehensive cleanup on company change
  const performDeepCleanup = useCallback((oldCompanyId: string) => {
    console.log('🧹 Performing deep cleanup for company:', oldCompanyId);
    
    // Clear company-specific data
    clearCompanyData(oldCompanyId);
    
    // Clear memory references
    memoryReferences.current.clear();
    
    // Clear any remaining DOM data attributes
    const elementsWithCompanyData = document.querySelectorAll(`[data-company-id="${oldCompanyId}"]`);
    elementsWithCompanyData.forEach(el => el.removeAttribute('data-company-id'));
    
    // Force garbage collection hint
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    // Clear any Web API storage
    if ('indexedDB' in window) {
      // Clear IndexedDB data if any company-specific databases exist
      // This is a placeholder for more comprehensive cleanup if needed
    }
  }, [clearCompanyData]);

  // Monitor company changes
  useEffect(() => {
    const currentCompanyId = config.companyId || profile?.company_id;
    
    if (previousCompanyId.current && previousCompanyId.current !== currentCompanyId) {
      console.log('🔄 Company change detected, initiating cleanup');
      performDeepCleanup(previousCompanyId.current);
    }
    
    previousCompanyId.current = currentCompanyId || null;
  }, [config.companyId, profile?.company_id, performDeepCleanup]);

  // Periodic leak detection
  useEffect(() => {
    if (config.enableLeakDetection) {
      leakDetectionTimer.current = setInterval(() => {
        const result = detectMemoryLeaks();
        if (result.leaksDetected && config.leakDetection?.alertOnDetection) {
          console.warn('🚨 Periodic leak detection alert:', result.leaks);
        }
      }, 30000); // Check every 30 seconds

      return () => {
        if (leakDetectionTimer.current) {
          clearInterval(leakDetectionTimer.current);
        }
      };
    }
  }, [config.enableLeakDetection, config.leakDetection?.alertOnDetection, detectMemoryLeaks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      memoryReferences.current.clear();
      if (leakDetectionTimer.current) {
        clearInterval(leakDetectionTimer.current);
      }
    };
  }, []);

  return {
    tabId,
    secureStorage,
    validateDataIntegrity,
    detectMemoryLeaks,
    performDeepCleanup,
    memoryStats: {
      referencesCount: memoryReferences.current.size,
      currentCompany: config.companyId || profile?.company_id
    }
  };
};