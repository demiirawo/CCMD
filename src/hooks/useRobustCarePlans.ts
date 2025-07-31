import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsRecovery } from './useAnalyticsRecovery';

export interface CarePlanData {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  naRisk: number;
  overdue: number;
  // Internal tracking
  _lastSaved?: string;
  _lastBackup?: string;
  _version?: number;
}

interface UseRobustCarePlansOptions {
  companyId: string;
  meetingId?: string;
  autoBackupInterval?: number;
  maxRetries?: number;
}

export const useRobustCarePlans = ({
  companyId,
  meetingId,
  autoBackupInterval = 30000,
  maxRetries = 3
}: UseRobustCarePlansOptions) => {
  const [data, setData] = useState<CarePlanData>({
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    naRisk: 0,
    overdue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saveQueue, setSaveQueue] = useState<Array<{ data: CarePlanData; timestamp: number }>>([]);

  const {
    createAnalyticsBackup,
    recoverAnalyticsData,
    validateAndRepairData,
    saveWithBackup,
    recoveryState
  } = useAnalyticsRecovery();

  // Auto-backup effect
  useEffect(() => {
    const interval = setInterval(() => {
      createAnalyticsBackup(companyId, meetingId || 'temp', 'care_plans', data, 'auto_backup');
    }, autoBackupInterval);

    return () => clearInterval(interval);
  }, [companyId, meetingId, data, autoBackupInterval, createAnalyticsBackup]);

  // Validate care plan data structure
  const validateCarePlanData = (carePlanData: any): CarePlanData => {
    const defaultData: CarePlanData = {
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0,
      naRisk: 0,
      overdue: 0
    };

    if (!carePlanData || typeof carePlanData !== 'object') {
      return defaultData;
    }

    return {
      highRisk: typeof carePlanData.highRisk === 'number' ? Math.max(0, carePlanData.highRisk) : 0,
      mediumRisk: typeof carePlanData.mediumRisk === 'number' ? Math.max(0, carePlanData.mediumRisk) : 0,
      lowRisk: typeof carePlanData.lowRisk === 'number' ? Math.max(0, carePlanData.lowRisk) : 0,
      naRisk: typeof carePlanData.naRisk === 'number' ? Math.max(0, carePlanData.naRisk) : 0,
      overdue: typeof carePlanData.overdue === 'number' ? Math.max(0, carePlanData.overdue) : 0,
      _lastSaved: carePlanData._lastSaved || new Date().toISOString(),
      _version: (carePlanData._version || 0) + 1
    };
  };

  // Load data with validation and recovery
  const loadData = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data: savedData, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', companyId)
        .eq('data_type', 'care_plan_overview')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      let loadedData: CarePlanData = {
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        naRisk: 0,
        overdue: 0
      };

      if (savedData?.data_content) {
        loadedData = savedData.data_content as any;
      }

      // Validate and repair data
      const validatedData = await validateAndRepairData(
        companyId,
        meetingId || 'temp',
        'care_plans',
        loadedData
      );

      setData(validateCarePlanData(validatedData || loadedData));
    } catch (error) {
      console.error('Error loading care plan data:', error);
      
      // Attempt recovery from backups
      try {
        const recoveredData = await recoverAnalyticsData(companyId, meetingId || 'temp', 'care_plans');
        if (recoveredData) {
          setData(validateCarePlanData(recoveredData));
          console.log('Successfully recovered care plan data from backup');
        }
      } catch (recoveryError) {
        console.error('Failed to recover care plan data:', recoveryError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, meetingId, validateAndRepairData, recoverAnalyticsData]);

  // Save data with retry logic and backup
  const saveData = useCallback(async (newData: CarePlanData, retryCount = 0) => {
    if (!companyId) return false;

    try {
      const dataToSave = validateCarePlanData({
        ...newData,
        _lastSaved: new Date().toISOString(),
        _version: (newData._version || 0) + 1
      });

      const success = await saveWithBackup(
        companyId,
        meetingId || 'temp',
        'care_plans',
        {
          company_id: companyId,
          meeting_id: meetingId,
          data_type: 'care_plan_overview',
          data_content: dataToSave,
          updated_at: new Date().toISOString()
        },
        'dashboard_data'
      );

      if (success) {
        setData(dataToSave);
        setSaveQueue(prev => prev.slice(1));
        return true;
      } else {
        throw new Error('Save operation returned false');
      }
    } catch (error) {
      console.error(`Error saving care plan data (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        setSaveQueue(prev => [...prev, { data: newData, timestamp: Date.now() }]);
        setTimeout(() => {
          saveData(newData, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      } else {
        console.error('Max retries exceeded for care plan data save');
        await createAnalyticsBackup(companyId, meetingId || 'temp', 'care_plans', newData, 'manual_backup');
      }
      return false;
    }
  }, [companyId, meetingId, maxRetries, saveWithBackup, createAnalyticsBackup]);

  // Update data and trigger save
  const updateData = useCallback(async (updates: Partial<CarePlanData>) => {
    const newData = validateCarePlanData({ ...data, ...updates });
    setData(newData);
    
    // Immediate backup
    await createAnalyticsBackup(companyId, meetingId || 'temp', 'care_plans', newData, 'manual_backup');
    
    // Async save
    saveData(newData);
  }, [data, companyId, meetingId, createAnalyticsBackup, saveData]);

  // Force recovery from backups
  const forceRecovery = useCallback(async () => {
    try {
      const recoveredData = await recoverAnalyticsData(companyId, meetingId || 'temp', 'care_plans');
      if (recoveredData) {
        setData(validateCarePlanData(recoveredData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Force recovery failed:', error);
      return false;
    }
  }, [companyId, meetingId, recoverAnalyticsData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    updateData,
    saveData,
    forceRecovery,
    recoveryState,
    saveQueue: saveQueue.length
  };
};