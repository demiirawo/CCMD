import React, { useEffect, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSecureQueryClient } from '@/hooks/useSecureQueryClient';
import { useEnhancedDataIsolation } from '@/hooks/useEnhancedDataIsolation';

interface DataLeakage {
  type: 'storage' | 'cache' | 'memory' | 'dom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  foreignCompanyIds?: string[];
  timestamp: number;
}

/**
 * Development and production monitoring for data leakage between companies
 */
export const DataLeakageMonitor: React.FC = () => {
  const { profile } = useAuth();
  const { auditCache, clearCompanyCache } = useSecureQueryClient();
  const { detectMemoryLeaks, validateDataIntegrity, memoryStats } = useEnhancedDataIsolation({
    enableLeakDetection: true,
    enableRuntimeValidation: true,
    enableMemoryMonitoring: true,
    leakDetection: {
      enabled: true,
      alertOnDetection: true,
      autoCleanup: false
    }
  });
  
  const [leakages, setLeakages] = useState<DataLeakage[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  // Scan for storage leakages
  const scanStorageLeakages = useCallback((): DataLeakage[] => {
    const currentCompanyId = profile?.company_id;
    if (!currentCompanyId) return [];

    const leaks: DataLeakage[] = [];
    const companyIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = localStorage.getItem(key);
      if (!value) continue;

      const foundIds = value.match(companyIdPattern) || [];
      const foreignIds = foundIds.filter(id => id !== currentCompanyId);

      if (foreignIds.length > 0) {
        leaks.push({
          type: 'storage',
          severity: 'high',
          description: `localStorage key "${key}" contains foreign company data`,
          source: `localStorage: ${key}`,
          foreignCompanyIds: foreignIds,
          timestamp: Date.now()
        });
      }

      // Check if key itself contains foreign company ID
      if (key.includes('company_') && !key.includes(currentCompanyId)) {
        leaks.push({
          type: 'storage',
          severity: 'critical',
          description: `localStorage key belongs to different company`,
          source: `localStorage: ${key}`,
          foreignCompanyIds: [key.match(companyIdPattern)?.[0] || 'unknown'],
          timestamp: Date.now()
        });
      }
    }

    // Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || key === '__tab_id') continue;

      const value = sessionStorage.getItem(key);
      if (!value) continue;

      const foundIds = value.match(companyIdPattern) || [];
      const foreignIds = foundIds.filter(id => id !== currentCompanyId);

      if (foreignIds.length > 0) {
        leaks.push({
          type: 'storage',
          severity: 'medium',
          description: `sessionStorage key "${key}" contains foreign company data`,
          source: `sessionStorage: ${key}`,
          foreignCompanyIds: foreignIds,
          timestamp: Date.now()
        });
      }
    }

    return leaks;
  }, [profile?.company_id]);

  // Scan for cache leakages
  const scanCacheLeakages = useCallback((): DataLeakage[] => {
    const auditResult = auditCache();
    if (auditResult.clean) return [];

    return auditResult.contaminations?.map(contamination => ({
      type: 'cache' as const,
      severity: 'high' as const,
      description: contamination.reason,
      source: `React Query: ${JSON.stringify(contamination.queryKey)}`,
      foreignCompanyIds: contamination.foreignCompanies,
      timestamp: Date.now()
    })) || [];
  }, [auditCache]);

  // Scan for DOM leakages
  const scanDOMLeakages = useCallback((): DataLeakage[] => {
    const currentCompanyId = profile?.company_id;
    if (!currentCompanyId) return [];

    const leaks: DataLeakage[] = [];
    
    // Check for elements with company data attributes
    const elementsWithCompanyData = document.querySelectorAll('[data-company-id]');
    elementsWithCompanyData.forEach(element => {
      const companyId = element.getAttribute('data-company-id');
      if (companyId && companyId !== currentCompanyId) {
        leaks.push({
          type: 'dom',
          severity: 'medium',
          description: `DOM element contains foreign company data attribute`,
          source: `Element: ${element.tagName}[data-company-id="${companyId}"]`,
          foreignCompanyIds: [companyId],
          timestamp: Date.now()
        });
      }
    });

    // Check for text content with company IDs
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let textNode;
    const companyIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
    
    while (textNode = walker.nextNode()) {
      const content = textNode.textContent || '';
      const foundIds = content.match(companyIdPattern) || [];
      const foreignIds = foundIds.filter(id => id !== currentCompanyId);
      
      if (foreignIds.length > 0) {
        leaks.push({
          type: 'dom',
          severity: 'low',
          description: `Text content contains foreign company IDs`,
          source: `Text content in ${textNode.parentElement?.tagName || 'unknown'}`,
          foreignCompanyIds: foreignIds,
          timestamp: Date.now()
        });
        break; // Limit to first occurrence to avoid spam
      }
    }

    return leaks;
  }, [profile?.company_id]);

  // Comprehensive leak scan
  const performLeakScan = useCallback(() => {
    const allLeaks = [
      ...scanStorageLeakages(),
      ...scanCacheLeakages(),
      ...scanDOMLeakages()
    ];

    // Add memory leaks
    const memoryResult = detectMemoryLeaks();
    if (memoryResult.leaksDetected) {
      memoryResult.leaks?.forEach(leak => {
        allLeaks.push({
          type: 'memory',
          severity: 'medium',
          description: leak,
          source: 'Memory monitoring',
          timestamp: Date.now()
        });
      });
    }

    setLeakages(allLeaks);
    return allLeaks;
  }, [scanStorageLeakages, scanCacheLeakages, scanDOMLeakages, detectMemoryLeaks]);

  // Auto-cleanup detected leaks
  const autoCleanupLeaks = useCallback((detectedLeaks: DataLeakage[]) => {
    const currentCompanyId = profile?.company_id;
    if (!currentCompanyId) return;

    detectedLeaks.forEach(leak => {
      try {
        switch (leak.type) {
          case 'storage':
            if (leak.source.startsWith('localStorage:')) {
              const key = leak.source.replace('localStorage: ', '');
              localStorage.removeItem(key);
              console.log('🧹 Auto-cleaned localStorage:', key);
            } else if (leak.source.startsWith('sessionStorage:')) {
              const key = leak.source.replace('sessionStorage: ', '');
              sessionStorage.removeItem(key);
              console.log('🧹 Auto-cleaned sessionStorage:', key);
            }
            break;
          case 'cache':
            if (leak.foreignCompanyIds) {
              leak.foreignCompanyIds.forEach(companyId => {
                clearCompanyCache(companyId);
              });
              console.log('🧹 Auto-cleaned cache for:', leak.foreignCompanyIds);
            }
            break;
          case 'dom':
            const elements = document.querySelectorAll('[data-company-id]');
            elements.forEach(el => {
              const companyId = el.getAttribute('data-company-id');
              if (companyId !== currentCompanyId) {
                el.removeAttribute('data-company-id');
              }
            });
            console.log('🧹 Auto-cleaned DOM attributes');
            break;
        }
      } catch (error) {
        console.error('Error during auto-cleanup:', error);
      }
    });
  }, [profile?.company_id, clearCompanyCache]);

  // Toggle monitoring
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        setMonitoringInterval(null);
      }
      setIsMonitoring(false);
    } else {
      const interval = setInterval(() => {
        const detectedLeaks = performLeakScan();
        if (detectedLeaks.length > 0) {
          console.warn('🚨 Data leakages detected:', detectedLeaks.length);
          // Auto-cleanup critical leaks
          const criticalLeaks = detectedLeaks.filter(l => l.severity === 'critical');
          if (criticalLeaks.length > 0) {
            autoCleanupLeaks(criticalLeaks);
          }
        }
      }, 10000); // Check every 10 seconds
      
      setMonitoringInterval(interval);
      setIsMonitoring(true);
    }
  }, [isMonitoring, monitoringInterval, performLeakScan, autoCleanupLeaks]);

  // Manual cleanup all
  const cleanupAllLeaks = useCallback(() => {
    autoCleanupLeaks(leakages);
    setTimeout(() => {
      performLeakScan(); // Re-scan after cleanup
    }, 1000);
  }, [leakages, autoCleanupLeaks, performLeakScan]);

  // Initial scan on mount
  useEffect(() => {
    performLeakScan();
  }, [performLeakScan]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityCount = (severity: string) => {
    return leakages.filter(leak => leak.severity === severity).length;
  };

  // Only show in development or for super admin
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isSuperAdmin = profile?.role === 'admin';
  
  if (!isDevelopment && !isSuperAdmin) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Data Leakage Monitor
          <Badge variant={leakages.length > 0 ? "destructive" : "default"}>
            {leakages.length} issues
          </Badge>
          {isMonitoring && (
            <Badge variant="secondary" className="animate-pulse">
              Monitoring Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={toggleMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
          <Button onClick={performLeakScan} variant="outline">
            Scan Now
          </Button>
          {leakages.length > 0 && (
            <Button onClick={cleanupAllLeaks} variant="outline">
              <Trash2 className="w-4 h-4 mr-2" />
              Cleanup All
            </Button>
          )}
          <Button 
            onClick={() => setShowDetails(!showDetails)} 
            variant="outline"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-red-100 rounded">
            <div className="font-bold text-red-800">{getSeverityCount('critical')}</div>
            <div className="text-xs text-red-600">Critical</div>
          </div>
          <div className="text-center p-2 bg-orange-100 rounded">
            <div className="font-bold text-orange-800">{getSeverityCount('high')}</div>
            <div className="text-xs text-orange-600">High</div>
          </div>
          <div className="text-center p-2 bg-yellow-100 rounded">
            <div className="font-bold text-yellow-800">{getSeverityCount('medium')}</div>
            <div className="text-xs text-yellow-600">Medium</div>
          </div>
          <div className="text-center p-2 bg-blue-100 rounded">
            <div className="font-bold text-blue-800">{getSeverityCount('low')}</div>
            <div className="text-xs text-blue-600">Low</div>
          </div>
        </div>

        {/* Memory Stats */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h4 className="font-semibold text-sm mb-2">Memory Statistics</h4>
          <div className="text-xs">
            <div>References: {memoryStats.referencesCount}</div>
            <div>Current Company: {memoryStats.currentCompany || 'None'}</div>
          </div>
        </div>

        {/* Detailed leakages */}
        {showDetails && leakages.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {leakages.map((leak, index) => (
              <Alert key={index} className="p-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className={`${getSeverityColor(leak.severity)} text-white text-xs`}>
                        {leak.severity.toUpperCase()}
                      </Badge>
                      <span className="ml-2 text-sm">{leak.description}</span>
                      <div className="text-xs text-gray-600 mt-1">{leak.source}</div>
                      {leak.foreignCompanyIds && (
                        <div className="text-xs text-red-600 mt-1">
                          Foreign companies: {leak.foreignCompanyIds.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(leak.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {leakages.length === 0 && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              No data leakages detected. All company data appears to be properly isolated.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};