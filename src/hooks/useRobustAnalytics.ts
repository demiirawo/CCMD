import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAnalyticsRecovery } from './useAnalyticsRecovery';

interface AnalyticsData {
  [key: string]: any;
  _lastSaved?: string;
  _backupCreated?: string;
  _recovered?: boolean;
}

interface UseRobustAnalyticsOptions {
  companyId: string;
  meetingId: string;
  analyticsType: string;
  tableName: string;
  autoBackupInterval?: number; // milliseconds
  retryAttempts?: number;
}

export const useRobustAnalytics = ({
  companyId,
  meetingId,
  analyticsType,
  tableName,
  autoBackupInterval = 30000, // 30 seconds
  retryAttempts = 3
}: UseRobustAnalyticsOptions) => {
  const [data, setData] = useState<AnalyticsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveQueue, setSaveQueue] = useState<AnalyticsData[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  
  const {
    createAnalyticsBackup,
    recoverAnalyticsData,
    validateAndRepairData,
    saveWithBackup,
    recoveryState
  } = useAnalyticsRecovery();

  // Auto-backup interval
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;

    const interval = setInterval(async () => {
      console.log(`🔄 Auto-backup for ${analyticsType}`);
      await createAnalyticsBackup(companyId, meetingId, analyticsType, data, 'auto_backup');
    }, autoBackupInterval);

    return () => clearInterval(interval);
  }, [data, companyId, meetingId, analyticsType, autoBackupInterval, createAnalyticsBackup]);

  // Load initial data with recovery
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log(`📂 Loading ${analyticsType} data...`);
      
      // Try to load from database
      const { data: dbData, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('company_id', companyId)
        .eq('meeting_id', meetingId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`Failed to load ${analyticsType} from database:`, error);
      }

      let loadedData = null;

      if (dbData && dbData.length > 0) {
        loadedData = dbData[0];
        console.log(`✅ Loaded ${analyticsType} from database`);
      }

      // Validate and repair the loaded data
      const validatedData = await validateAndRepairData(
        companyId,
        meetingId,
        analyticsType,
        loadedData
      );

      if (validatedData) {
        setData({
          ...validatedData,
          _lastSaved: new Date().toISOString()
        });
      } else {
        // Initialize with empty data
        const emptyData = getDefaultAnalyticsData(analyticsType);
        setData(emptyData);
        
        // Create initial backup
        await createAnalyticsBackup(companyId, meetingId, analyticsType, emptyData, 'auto_backup');
      }

    } catch (error) {
      console.error(`Error loading ${analyticsType}:`, error);
      
      // Try to recover from backup
      try {
        const recoveredData = await recoverAnalyticsData(companyId, meetingId, analyticsType);
        if (recoveredData) {
          setData({
            ...recoveredData,
            _recovered: true
          });
          toast({
            title: "Data Recovered",
            description: `${analyticsType} data was recovered from backup`,
          });
        } else {
          // Last resort: start with default data
          setData(getDefaultAnalyticsData(analyticsType));
        }
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        setData(getDefaultAnalyticsData(analyticsType));
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, meetingId, analyticsType, tableName, validateAndRepairData, recoverAnalyticsData, createAnalyticsBackup, toast]);

  // Save data with retry logic and queueing
  const saveData = useCallback(async (newData: AnalyticsData, forceRetry = false) => {
    try {
      const dataToSave = {
        ...newData,
        _lastSaved: new Date().toISOString()
      };

      const success = await saveWithBackup(
        companyId,
        meetingId,
        analyticsType,
        dataToSave,
        tableName
      );

      if (success) {
        setData(dataToSave);
        setRetryCount(0);
        setSaveQueue(prev => prev.filter(item => item !== newData));
        return true;
      } else {
        throw new Error('Save failed');
      }

    } catch (error) {
      console.error(`Failed to save ${analyticsType}:`, error);
      
      if (retryCount < retryAttempts) {
        console.log(`🔄 Queuing retry ${retryCount + 1}/${retryAttempts} for ${analyticsType}`);
        setSaveQueue(prev => [...prev, newData]);
        setRetryCount(prev => prev + 1);
        
        // Retry after a delay
        setTimeout(() => {
          saveData(newData, true);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
        
        return false;
      } else {
        toast({
          title: "Save Failed",
          description: `Failed to save ${analyticsType} after ${retryAttempts} attempts. Data is backed up locally.`,
          variant: "destructive"
        });
        
        // Reset retry count for future saves
        setRetryCount(0);
        return false;
      }
    }
  }, [companyId, meetingId, analyticsType, tableName, saveWithBackup, retryCount, retryAttempts, toast]);

  // Update data with automatic saving
  const updateData = useCallback(async (updates: Partial<AnalyticsData>) => {
    const newData = {
      ...data,
      ...updates,
      _lastSaved: new Date().toISOString()
    };

    // Update local state immediately for responsiveness
    setData(newData);

    // Create backup immediately
    await createAnalyticsBackup(companyId, meetingId, analyticsType, newData, 'auto_backup');

    // Save to database
    await saveData(newData);
  }, [data, companyId, meetingId, analyticsType, createAnalyticsBackup, saveData]);

  // Force data recovery
  const forceRecovery = useCallback(async () => {
    try {
      const recoveredData = await recoverAnalyticsData(companyId, meetingId, analyticsType);
      if (recoveredData) {
        setData({
          ...recoveredData,
          _recovered: true,
          _lastSaved: new Date().toISOString()
        });
        toast({
          title: "Data Recovered",
          description: `${analyticsType} data was manually recovered from backup`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Manual recovery failed:', error);
      toast({
        title: "Recovery Failed",
        description: `Failed to recover ${analyticsType} data`,
        variant: "destructive"
      });
      return false;
    }
  }, [companyId, meetingId, analyticsType, recoverAnalyticsData, toast]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Process save queue
  useEffect(() => {
    if (saveQueue.length > 0 && !isLoading) {
      const nextItem = saveQueue[0];
      saveData(nextItem);
    }
  }, [saveQueue, isLoading, saveData]);

  return {
    data,
    isLoading,
    updateData,
    saveData,
    forceRecovery,
    recoveryState,
    saveQueue: saveQueue.length,
    retryCount,
    hasUnsavedChanges: saveQueue.length > 0
  };
};

// Default data structures for different analytics types
function getDefaultAnalyticsData(analyticsType: string): AnalyticsData {
  switch (analyticsType) {
    case 'resourcing_overview':
      return {
        active: 0,
        onboarding: 0,
        onProbation: 0,
        requiredStaffingLevel: 0
      };
    case 'staff_documents':
      return {
        activeCompliant: 0,
        onboardingCompliant: 0,
        onProbationCompliant: 0
      };
    case 'staff_training':
      return {
        mandatoryTraining: {},
        additionalTraining: {},
        expiringCertifications: []
      };
    case 'spot_check':
      return {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        monthlyData: []
      };
    case 'supervision':
      return {
        totalSupervisions: 0,
        completedSupervisions: 0,
        overdueSupervisions: 0,
        monthlyData: []
      };
    case 'feedback':
      return {
        totalFeedback: 0,
        positiveFeedback: 0,
        negativeFeedback: 0,
        monthlyData: []
      };
    case 'incidents':
      return {
        totalIncidents: 0,
        resolvedIncidents: 0,
        pendingIncidents: 0,
        monthlyData: []
      };
    case 'care_plan':
    case 'care_plan_overview':
      return {
        high_risk: 0,
        medium_risk: 0,
        low_risk: 0,
        na_risk: 0,
        overdue: 0
      };
    case 'medication':
      return {
        totalMedications: 0,
        errorsMedications: 0,
        monthlyData: []
      };
    case 'care_notes':
      return {
        totalNotes: 0,
        qualityNotes: 0,
        monthlyData: []
      };
    default:
      return {};
  }
}