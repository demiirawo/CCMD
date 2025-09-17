import React, { useEffect, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSecureQueryClient } from '@/hooks/useSecureQueryClient';
import { useEnhancedDataIsolation } from '@/hooks/useEnhancedDataIsolation';
import { supabase } from '@/integrations/supabase/client';

interface DataLeakage {
  type: 'storage' | 'cache' | 'memory' | 'dom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  foreignCompanyIds?: string[];
  foreignCompanyNames?: string[];
  fieldName?: string;
  leakedText?: string;
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
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});

  // Fetch company names for display
  const fetchCompanyNames = useCallback(async (companyIds: string[]) => {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);
      
      if (companies) {
        const nameMap: Record<string, string> = {};
        companies.forEach(company => {
          nameMap[company.id] = company.name;
        });
        setCompanyNames(prev => ({ ...prev, ...nameMap }));
        return nameMap;
      }
    } catch (error) {
      console.error('Error fetching company names:', error);
    }
    return {};
  }, []);

  // Scan for storage leakages
  const scanStorageLeakages = useCallback(async (): Promise<DataLeakage[]> => {
    const currentCompanyId = profile?.company_id;
    if (!currentCompanyId) return [];

    const leaks: DataLeakage[] = [];
    const companyIdPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g;
    const allForeignIds: string[] = [];

    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = localStorage.getItem(key);
      if (!value) continue;

      const foundIds = value.match(companyIdPattern) || [];
      const foreignIds = foundIds.filter(id => id !== currentCompanyId);

      if (foreignIds.length > 0) {
        allForeignIds.push(...foreignIds);

        // Extract field information from JSON data
        let fieldInfo = '';
        let leakedText = '';
        try {
          const parsedValue = JSON.parse(value);
          if (typeof parsedValue === 'object') {
            const fieldWithCompanyId = Object.keys(parsedValue).find(k => 
              foreignIds.some(id => parsedValue[k]?.toString().includes(id))
            );
            if (fieldWithCompanyId) {
              fieldInfo = fieldWithCompanyId;
              leakedText = JSON.stringify(parsedValue[fieldWithCompanyId]).substring(0, 100);
            }
          }
        } catch {
          // If not JSON, show first 100 chars of raw value
          leakedText = value.substring(0, 100);
        }

        leaks.push({
          type: 'storage',
          severity: 'high',
          description: `Your browser's local storage contains data belonging to other companies. This data persists even after switching companies.`,
          source: `Browser Local Storage`,
          foreignCompanyIds: foreignIds,
          fieldName: fieldInfo || key,
          leakedText: leakedText + (leakedText.length === 100 ? '...' : ''),
          timestamp: Date.now()
        });
      }

      // Check if key itself contains foreign company ID
      const keyCompanyId = key.match(companyIdPattern)?.[0];
      if (keyCompanyId && keyCompanyId !== currentCompanyId) {
        allForeignIds.push(keyCompanyId);
        leaks.push({
          type: 'storage',
          severity: 'critical',
          description: `CRITICAL: Your current browser session is storing data that was meant for another company. This is a serious security breach.`,
          source: `Browser Local Storage`,
          foreignCompanyIds: [keyCompanyId],
          fieldName: key,
          leakedText: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
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
        allForeignIds.push(...foreignIds);

        // Extract field information from JSON data
        let fieldInfo = '';
        let leakedText = '';
        try {
          const parsedValue = JSON.parse(value);
          if (typeof parsedValue === 'object') {
            const fieldWithCompanyId = Object.keys(parsedValue).find(k => 
              foreignIds.some(id => parsedValue[k]?.toString().includes(id))
            );
            if (fieldWithCompanyId) {
              fieldInfo = fieldWithCompanyId;
              leakedText = JSON.stringify(parsedValue[fieldWithCompanyId]).substring(0, 100);
            }
          }
        } catch {
          leakedText = value.substring(0, 100);
        }

        leaks.push({
          type: 'storage',
          severity: 'medium',
          description: `Your browser's temporary session data contains information from other companies. This data will be cleared when you close the browser tab.`,
          source: `Browser Session Storage`,
          foreignCompanyIds: foreignIds,
          fieldName: fieldInfo || key,
          leakedText: leakedText + (leakedText.length === 100 ? '...' : ''),
          timestamp: Date.now()
        });
      }
    }

    // Fetch company names for all foreign IDs
    if (allForeignIds.length > 0) {
      const uniqueForeignIds = [...new Set(allForeignIds)];
      const nameMapping = await fetchCompanyNames(uniqueForeignIds);
      
      // Update leaks with company names
      leaks.forEach(leak => {
        if (leak.foreignCompanyIds) {
          leak.foreignCompanyNames = leak.foreignCompanyIds.map(id => nameMapping[id] || `Unknown (${id})`);
        }
      });
    }

    return leaks;
  }, [profile?.company_id, fetchCompanyNames]);

  // Scan for cache leakages
  const scanCacheLeakages = useCallback(async (): Promise<DataLeakage[]> => {
    const auditResult = auditCache();
    if (auditResult.clean) return [];

    const leaks = auditResult.contaminations?.map(contamination => ({
      type: 'cache' as const,
      severity: 'high' as const,
      description: `The application's memory cache is storing data queries that belong to other companies. This cached data could be accidentally displayed to you.`,
      source: `Application Memory Cache`,
      foreignCompanyIds: contamination.foreignCompanies,
      foreignCompanyNames: [] as string[],
      fieldName: `Database Query: ${contamination.queryKey?.[0] || 'unknown'}`,
      leakedText: JSON.stringify(contamination.queryKey).substring(0, 100),
      timestamp: Date.now()
    })) || [];

    // Fetch company names for cache leaks
    const allForeignIds = leaks.flatMap(leak => leak.foreignCompanyIds || []);
    if (allForeignIds.length > 0) {
      const uniqueForeignIds = [...new Set(allForeignIds)];
      const nameMapping = await fetchCompanyNames(uniqueForeignIds);
      
      leaks.forEach(leak => {
        if (leak.foreignCompanyIds) {
          leak.foreignCompanyNames = leak.foreignCompanyIds.map(id => nameMapping[id] || `Unknown (${id})`);
        }
      });
    }

    return leaks;
  }, [auditCache, fetchCompanyNames]);

  // Scan for DOM leakages
  const scanDOMLeakages = useCallback(async (): Promise<DataLeakage[]> => {
    const currentCompanyId = profile?.company_id;
    if (!currentCompanyId) return [];

    const leaks: DataLeakage[] = [];
    const allForeignIds: string[] = [];
    
    // Check for elements with company data attributes
    const elementsWithCompanyData = document.querySelectorAll('[data-company-id]');
    elementsWithCompanyData.forEach(element => {
      const companyId = element.getAttribute('data-company-id');
      if (companyId && companyId !== currentCompanyId) {
        allForeignIds.push(companyId);
        leaks.push({
          type: 'dom',
          severity: 'medium',
          description: `Web page elements are tagged with data belonging to other companies. This could cause confusion about which company's data you're viewing.`,
          source: `Web Page Elements`,
          foreignCompanyIds: [companyId],
          fieldName: 'Element Attribute',
          leakedText: companyId,
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
        allForeignIds.push(...foreignIds);
        const leakedTextSnippet = content.substring(0, 200);
        leaks.push({
          type: 'dom',
          severity: 'low',
          description: `Text visible on the web page contains company identifiers from other companies. This may expose sensitive company information.`,
          source: `Visible Text Content`,
          foreignCompanyIds: foreignIds,
          fieldName: 'Page Text',
          leakedText: leakedTextSnippet + (content.length > 200 ? '...' : ''),
          timestamp: Date.now()
        });
        break; // Limit to first occurrence to avoid spam
      }
    }

    // Fetch company names for DOM leaks
    if (allForeignIds.length > 0) {
      const uniqueForeignIds = [...new Set(allForeignIds)];
      const nameMapping = await fetchCompanyNames(uniqueForeignIds);
      
      leaks.forEach(leak => {
        if (leak.foreignCompanyIds) {
          leak.foreignCompanyNames = leak.foreignCompanyIds.map(id => nameMapping[id] || `Unknown (${id})`);
        }
      });
    }

    return leaks;
  }, [profile?.company_id, fetchCompanyNames]);

  // Comprehensive leak scan
  const performLeakScan = useCallback(async () => {
    const allLeaks = [
      ...(await scanStorageLeakages()),
      ...(await scanCacheLeakages()),
      ...(await scanDOMLeakages())
    ];

    // Add memory leaks
    const memoryResult = detectMemoryLeaks();
    if (memoryResult.leaksDetected) {
      memoryResult.leaks?.forEach(leak => {
        allLeaks.push({
          type: 'memory',
          severity: 'medium',
          description: `The application's memory contains references to data from other companies. This could indicate incomplete cleanup when switching between companies.`,
          source: 'Application Memory',
          fieldName: 'Memory Reference',
          leakedText: leak.substring(0, 100),
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
      const interval = setInterval(async () => {
        const detectedLeaks = await performLeakScan();
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
                      <div className="text-sm font-medium text-gray-900 mb-2">{leak.description}</div>
                      
                      <div className="space-y-2">
                        <div className="text-xs">
                          <span className="font-semibold text-blue-700">📍 Location:</span>
                          <span className="ml-1 text-gray-700">{leak.source}</span>
                        </div>
                        
                        {leak.foreignCompanyNames && leak.foreignCompanyNames.length > 0 && (
                          <div className="text-xs">
                            <span className="font-semibold text-red-700">🏢 Companies affected:</span>
                            <span className="ml-1 text-red-600">{leak.foreignCompanyNames.join(', ')}</span>
                          </div>
                        )}
                        
                        {leak.fieldName && (
                          <div className="text-xs">
                            <span className="font-semibold text-purple-700">🏷️ Data field:</span>
                            <span className="ml-1 text-purple-600">{leak.fieldName}</span>
                          </div>
                        )}
                        
                        {leak.leakedText && (
                          <div className="text-xs">
                            <span className="font-semibold text-orange-700">📝 Leaked content:</span>
                            <div className="mt-1 bg-orange-50 border border-orange-200 p-2 rounded text-orange-800 font-mono text-xs break-all">
                              {leak.leakedText}
                            </div>
                          </div>
                        )}
                      </div>
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