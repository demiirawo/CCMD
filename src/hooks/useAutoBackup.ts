import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BackupData {
  timestamp: string;
  headerData: any;
  dashboardData: any;
  actionsLog: any[];
  keyDocuments: any[];
  meetingId: string;
}

export const useAutoBackup = () => {
  const { profile } = useAuth();
  const lastBackupRef = useRef<BackupData | null>(null);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create backup of current dashboard state
  const createBackup = useCallback(async (
    headerData: any,
    dashboardData: any,
    actionsLog: any[],
    keyDocuments: any[],
    meetingId: string
  ) => {
    if (!profile?.company_id) return;

    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      headerData,
      dashboardData,
      actionsLog,
      keyDocuments,
      meetingId
    };

    try {
      // Store backup in Supabase
      const { error } = await supabase
        .from('meeting_backups')
        .upsert({
          company_id: profile.company_id,
          backup_data: backupData,
          meeting_id: meetingId,
          backup_type: 'auto'
        }, {
          onConflict: 'company_id,meeting_id,backup_type'
        });

      if (error) {
        console.error('Error creating auto backup:', error);
      } else {
        lastBackupRef.current = backupData;
        console.log('Auto backup created successfully at:', backupData.timestamp);
      }
    } catch (error) {
      console.error('Failed to create auto backup:', error);
    }
  }, [profile?.company_id]);

  // Restore from backup
  const restoreFromBackup = useCallback(async (meetingId: string) => {
    if (!profile?.company_id) return null;

    try {
      const { data, error } = await supabase
        .from('meeting_backups')
        .select('backup_data')
        .eq('company_id', profile.company_id)
        .eq('meeting_id', meetingId)
        .eq('backup_type', 'auto')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error restoring from backup:', error);
        return null;
      }

      if (data && data.length > 0) {
        const backupData = data[0].backup_data as BackupData;
        console.log('Restored from backup:', backupData.timestamp);
        return backupData;
      }

      return null;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return null;
    }
  }, [profile?.company_id]);

  // Start auto backup with interval
  const startAutoBackup = useCallback((
    headerData: any,
    dashboardData: any,
    actionsLog: any[],
    keyDocuments: any[],
    meetingId: string,
    intervalMinutes: number = 5
  ) => {
    // Clear existing interval
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
    }

    // Create initial backup
    createBackup(headerData, dashboardData, actionsLog, keyDocuments, meetingId);

    // Set up recurring backup
    backupIntervalRef.current = setInterval(() => {
      createBackup(headerData, dashboardData, actionsLog, keyDocuments, meetingId);
    }, intervalMinutes * 60 * 1000);

    console.log(`Auto backup started with ${intervalMinutes} minute intervals`);
  }, [createBackup]);

  // Stop auto backup
  const stopAutoBackup = useCallback(() => {
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
      backupIntervalRef.current = null;
      console.log('Auto backup stopped');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoBackup();
    };
  }, [stopAutoBackup]);

  return {
    createBackup,
    restoreFromBackup,
    startAutoBackup,
    stopAutoBackup,
    lastBackup: lastBackupRef.current
  };
};