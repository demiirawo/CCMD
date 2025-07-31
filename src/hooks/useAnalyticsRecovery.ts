import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsBackup {
  id?: string;
  company_id: string;
  meeting_id: string;
  analytics_type: string;
  data_snapshot: any;
  timestamp: string;
  source: 'auto_backup' | 'manual_backup' | 'recovery';
}

interface AnalyticsRecoveryState {
  isRecovering: boolean;
  lastBackup: string | null;
  recoveryAttempts: number;
}

export const useAnalyticsRecovery = () => {
  const { toast } = useToast();
  const [recoveryState, setRecoveryState] = useState<AnalyticsRecoveryState>({
    isRecovering: false,
    lastBackup: null,
    recoveryAttempts: 0
  });

  // Create automatic backup of analytics data
  const createAnalyticsBackup = useCallback(async (
    companyId: string,
    meetingId: string,
    analyticsType: string,
    data: any,
    source: 'auto_backup' | 'manual_backup' | 'recovery' = 'auto_backup'
  ) => {
    try {
      const backup: AnalyticsBackup = {
        company_id: companyId,
        meeting_id: meetingId,
        analytics_type: analyticsType,
        data_snapshot: data,
        timestamp: new Date().toISOString(),
        source
      };

      // Store in localStorage as immediate backup
      const localKey = `analytics_backup_${analyticsType}_${meetingId}`;
      localStorage.setItem(localKey, JSON.stringify(backup));

      // For now, just use localStorage as the primary backup
      // Database backup will be enabled once types are updated
      console.log(`✅ Analytics backup created for ${analyticsType} in localStorage`);

      setRecoveryState(prev => ({
        ...prev,
        lastBackup: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Failed to create analytics backup:', error);
    }
  }, []);

  // Recover analytics data from backups
  const recoverAnalyticsData = useCallback(async (
    companyId: string,
    meetingId: string,
    analyticsType: string
  ): Promise<any | null> => {
    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1
    }));

    try {
      console.log(`🔄 Attempting to recover ${analyticsType} data for meeting ${meetingId}`);

      // First, try to recover from localStorage
      const localKey = `analytics_backup_${analyticsType}_${meetingId}`;
      const localBackup = localStorage.getItem(localKey);
      
      if (localBackup) {
        try {
          const backup = JSON.parse(localBackup) as AnalyticsBackup;
          console.log(`📁 Found localStorage backup for ${analyticsType}`);
          
          // Validate the backup data
          if (backup.data_snapshot && backup.company_id === companyId) {
            setRecoveryState(prev => ({ ...prev, isRecovering: false }));
            return backup.data_snapshot;
          }
        } catch (error) {
          console.warn('Failed to parse localStorage backup:', error);
        }
      }

      // Try to find similar backups in localStorage from other meetings
      const allLocalKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`analytics_backup_${analyticsType}_`)) {
          allLocalKeys.push(key);
        }
      }

      if (allLocalKeys.length > 0) {
        // Sort by timestamp to get the most recent
        const backupsWithTimestamp = allLocalKeys.map(key => {
          try {
            const backup = JSON.parse(localStorage.getItem(key) || '');
            return { key, backup, timestamp: new Date(backup.timestamp) };
          } catch {
            return null;
          }
        }).filter(Boolean).sort((a, b) => b!.timestamp.getTime() - a!.timestamp.getTime());

        if (backupsWithTimestamp.length > 0) {
          const recentBackup = backupsWithTimestamp[0]!.backup;
          console.log(`🔍 Found similar localStorage backup for ${analyticsType}, using as template`);
          
          // Reset data to template but mark it as recovered
          const recoveredData = {
            ...recentBackup.data_snapshot,
            _recovered: true,
            _recoveryTimestamp: new Date().toISOString(),
            _originalMeetingId: recentBackup.meeting_id
          };

          setRecoveryState(prev => ({ ...prev, isRecovering: false }));
          return recoveredData;
        }
      }

      console.log(`❌ No recovery data found for ${analyticsType}`);
      setRecoveryState(prev => ({ ...prev, isRecovering: false }));
      return null;

    } catch (error) {
      console.error('Analytics recovery failed:', error);
      setRecoveryState(prev => ({ ...prev, isRecovering: false }));
      return null;
    }
  }, []);

  // Validate and repair analytics data integrity
  const validateAndRepairData = useCallback(async (
    companyId: string,
    meetingId: string,
    analyticsType: string,
    currentData: any
  ) => {
    try {
      // Basic validation checks
      const isValid = currentData && 
                     typeof currentData === 'object' && 
                     Object.keys(currentData).length > 0;

      if (!isValid) {
        console.log(`⚠️ Invalid ${analyticsType} data detected, attempting recovery`);
        
        const recoveredData = await recoverAnalyticsData(companyId, meetingId, analyticsType);
        
        if (recoveredData) {
          toast({
            title: "Data Recovered",
            description: `${analyticsType} data was automatically restored from backup`,
          });
          return recoveredData;
        } else {
          toast({
            title: "Data Recovery Failed",
            description: `Unable to recover ${analyticsType} data. Starting with fresh data.`,
            variant: "destructive"
          });
          return null;
        }
      }

      return currentData;
    } catch (error) {
      console.error('Data validation failed:', error);
      return currentData;
    }
  }, [recoverAnalyticsData, toast]);

  // Cleanup old backups to prevent storage bloat
  const cleanupOldBackups = useCallback(async (companyId: string) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // For now, database cleanup will be added later once types are updated
      console.log('Database cleanup will be enabled when types are updated');

      // Cleanup localStorage backups
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('analytics_backup_')) {
          try {
            const backup = JSON.parse(localStorage.getItem(key) || '');
            if (new Date(backup.timestamp) < thirtyDaysAgo) {
              keysToRemove.push(key);
            }
          } catch (error) {
            // Invalid backup, remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} old analytics backups`);
      }

    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }, []);

  // Enhanced save with automatic backup and recovery
  const saveWithBackup = useCallback(async (
    companyId: string,
    meetingId: string,
    analyticsType: string,
    data: any,
    tableName: string
  ) => {
    try {
      // Create backup before attempting save
      await createAnalyticsBackup(companyId, meetingId, analyticsType, data, 'auto_backup');

      // Attempt to save to the main table
      const { error } = await (supabase.from as any)(tableName)
        .upsert([{
          company_id: companyId,
          meeting_id: meetingId,
          ...data,
          updated_at: new Date().toISOString()
        }]);

      if (error) {
        console.error(`Failed to save ${analyticsType} to ${tableName}:`, error);
        
        // Create a recovery backup marking the failure
        await createAnalyticsBackup(companyId, meetingId, analyticsType, data, 'recovery');
        
        toast({
          title: "Save Failed",
          description: `Failed to save ${analyticsType} data, but backup was created`,
          variant: "destructive"
        });
        
        return false;
      }

      console.log(`✅ Successfully saved ${analyticsType} with backup`);
      return true;

    } catch (error) {
      console.error('Save with backup failed:', error);
      
      // Last resort: ensure we have the backup
      await createAnalyticsBackup(companyId, meetingId, analyticsType, data, 'recovery');
      
      return false;
    }
  }, [createAnalyticsBackup, toast]);

  return {
    createAnalyticsBackup,
    recoverAnalyticsData,
    validateAndRepairData,
    cleanupOldBackups,
    saveWithBackup,
    recoveryState
  };
};