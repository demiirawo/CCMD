import { useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useEnhancedAutoBackup } from './useEnhancedAutoBackup';

interface BackupData {
  timestamp: string;
  dashboardData: any;
  actionsLog: any[];
  keyDocuments: any[];
  meetingId: string;
}

export const useAutoBackup = () => {
  const { profile } = useAuth();
  const lastBackupRef = useRef<BackupData | null>(null);
  const { createAutoBackup: enhancedCreateAutoBackup } = useEnhancedAutoBackup();

  // Create auto backup - now using enhanced backup system
  const createAutoBackup = useCallback(async (
    dashboardData: any,
    actionsLog: any[],
    keyDocuments: any[],
    meetingId: string,
    meetingDate?: string
  ) => {
    if (!profile?.company_id) return;

    const backupData: BackupData = {
      timestamp: new Date().toISOString(),
      dashboardData,
      actionsLog,
      keyDocuments,
      meetingId
    };

    try {
      // Use enhanced backup system
      await enhancedCreateAutoBackup(
        dashboardData,
        actionsLog,
        keyDocuments,
        meetingId,
        meetingDate || new Date().toISOString().split('T')[0]
      );
      lastBackupRef.current = backupData;
    } catch (error) {
      console.error('Failed to create auto backup:', error);
    }
  }, [profile?.company_id, enhancedCreateAutoBackup]);

  // Restore from backup - temporarily disabled
  const restoreFromBackup = useCallback(async (meetingId: string) => {
    if (!profile?.company_id) return null;

    try {
      // Backup functionality temporarily disabled
      console.log('Restore from backup requested for meeting:', meetingId);
      return null;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return null;
    }
  }, [profile?.company_id]);

  // Get available backups - temporarily disabled
  const getAvailableBackups = useCallback(async () => {
    if (!profile?.company_id) return [];

    try {
      // Backup functionality temporarily disabled
      return [];
    } catch (error) {
      console.error('Failed to get available backups:', error);
      return [];
    }
  }, [profile?.company_id]);

  // Check if data has changed since last backup
  const hasDataChanged = useCallback((
    dashboardData: any,
    actionsLog: any[],
    keyDocuments: any[]
  ) => {
    if (!lastBackupRef.current) return true;

    const currentData = {
      dashboardData,
      actionsLog,
      keyDocuments
    };

    return JSON.stringify(currentData) !== JSON.stringify({
      dashboardData: lastBackupRef.current.dashboardData,
      actionsLog: lastBackupRef.current.actionsLog,
      keyDocuments: lastBackupRef.current.keyDocuments
    });
  }, []);

  return {
    createAutoBackup,
    restoreFromBackup,
    getAvailableBackups,
    hasDataChanged
  };
};