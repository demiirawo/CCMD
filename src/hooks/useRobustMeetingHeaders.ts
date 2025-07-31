import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsRecovery } from './useAnalyticsRecovery';

export interface MeetingHeaderData {
  meeting_date: string;
  title: string;
  attendees: any[];
  purpose: string;
  // Internal tracking
  _lastSaved?: string;
  _lastBackup?: string;
  _version?: number;
}

interface UseRobustMeetingHeadersOptions {
  companyId: string;
  meetingId?: string;
  autoBackupInterval?: number;
  maxRetries?: number;
}

export const useRobustMeetingHeaders = ({
  companyId,
  meetingId,
  autoBackupInterval = 30000,
  maxRetries = 3
}: UseRobustMeetingHeadersOptions) => {
  const [data, setData] = useState<MeetingHeaderData>({
    meeting_date: new Date().toISOString(),
    title: '',
    attendees: [],
    purpose: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saveQueue, setSaveQueue] = useState<Array<{ data: MeetingHeaderData; timestamp: number }>>([]);

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
      createAnalyticsBackup(companyId, meetingId || 'temp', 'meeting_headers', data, 'auto_backup');
    }, autoBackupInterval);

    return () => clearInterval(interval);
  }, [companyId, meetingId, data, autoBackupInterval, createAnalyticsBackup]);

  // Load data with validation and recovery
  const loadData = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data: meetingData, error } = await supabase
        .from('meeting_headers')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let loadedData: MeetingHeaderData = {
        meeting_date: new Date().toISOString(),
        title: '',
        attendees: [],
        purpose: ''
      };

      if (meetingData && meetingData.length > 0) {
        const record = meetingData[0];
        loadedData = {
          meeting_date: record.meeting_date,
          title: record.title || '',
          attendees: Array.isArray(record.attendees) ? record.attendees : [],
          purpose: record.purpose || '',
          _lastSaved: new Date().toISOString(),
          _version: 1
        };
      }

      // Validate and repair data
      const validatedData = await validateAndRepairData(
        companyId,
        meetingId || 'temp',
        'meeting_headers',
        loadedData
      );

      setData(validatedData || loadedData);
    } catch (error) {
      console.error('Error loading meeting headers:', error);
      
      // Attempt recovery from backups
      try {
        const recoveredData = await recoverAnalyticsData(companyId, meetingId || 'temp', 'meeting_headers');
        if (recoveredData) {
          setData(recoveredData);
          console.log('Successfully recovered meeting headers data from backup');
        }
      } catch (recoveryError) {
        console.error('Failed to recover meeting headers data:', recoveryError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, meetingId, validateAndRepairData, recoverAnalyticsData]);

  // Save data with retry logic and backup
  const saveData = useCallback(async (newData: MeetingHeaderData, retryCount = 0) => {
    if (!companyId) return false;

    try {
      // Update internal tracking
      const dataToSave = {
        ...newData,
        _lastSaved: new Date().toISOString(),
        _version: (newData._version || 0) + 1
      };

      const success = await saveWithBackup(
        companyId,
        meetingId || 'temp',
        'meeting_headers',
        {
          company_id: companyId,
          meeting_date: dataToSave.meeting_date,
          title: dataToSave.title,
          attendees: dataToSave.attendees,
          purpose: dataToSave.purpose,
          updated_at: new Date().toISOString()
        },
        'meeting_headers'
      );

      if (success) {
        setData(dataToSave);
        // Process any queued saves
        setSaveQueue(prev => prev.slice(1));
        return true;
      } else {
        throw new Error('Save operation returned false');
      }
    } catch (error) {
      console.error(`Error saving meeting headers (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        // Add to save queue and retry with exponential backoff
        setSaveQueue(prev => [...prev, { data: newData, timestamp: Date.now() }]);
        setTimeout(() => {
          saveData(newData, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      } else {
        console.error('Max retries exceeded for meeting headers save');
        // Create emergency backup
        await createAnalyticsBackup(companyId, meetingId || 'temp', 'meeting_headers', newData, 'manual_backup');
      }
      return false;
    }
  }, [companyId, meetingId, maxRetries, saveWithBackup, createAnalyticsBackup]);

  // Update data and trigger save
  const updateData = useCallback(async (updates: Partial<MeetingHeaderData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    
    // Immediate backup
    await createAnalyticsBackup(companyId, meetingId || 'temp', 'meeting_headers', newData, 'manual_backup');
    
    // Async save
    saveData(newData);
  }, [data, companyId, meetingId, createAnalyticsBackup, saveData]);

  // Force recovery from backups
  const forceRecovery = useCallback(async () => {
    try {
      const recoveredData = await recoverAnalyticsData(companyId, meetingId || 'temp', 'meeting_headers');
      if (recoveredData) {
        setData(recoveredData);
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