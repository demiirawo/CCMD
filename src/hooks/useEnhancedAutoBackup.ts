import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface BackupData {
  timestamp: string;
  dashboardData: any;
  actionsLog: any[];
  keyDocuments: any[];
  meetingId: string;
}

interface AuditEntry {
  operation: 'save' | 'load' | 'backup' | 'restore' | 'delete';
  tableName: string;
  meetingId?: string;
  dataSize?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: any;
}

export const useEnhancedAutoBackup = () => {
  const { profile } = useAuth();
  const lastBackupRef = useRef<BackupData | null>(null);

  // Create audit trail entry
  const createAuditEntry = useCallback(async (entry: AuditEntry) => {
    if (!profile?.company_id) return;

    try {
      await supabase.from('data_audit_trail').insert({
        company_id: profile.company_id,
        meeting_id: entry.meetingId,
        table_name: entry.tableName,
        operation: entry.operation,
        data_size: entry.dataSize,
        success: entry.success,
        error_message: entry.errorMessage,
        metadata: entry.metadata || {}
      });
    } catch (error) {
      console.error('Failed to create audit entry:', error);
    }
  }, [profile?.company_id]);

  // Enhanced auto backup with immediate database save
  const createAutoBackup = useCallback(async (
    dashboardData: any,
    actionsLog: any[],
    keyDocuments: any[],
    meetingId: string,
    meetingDate: string
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
      // Save to database immediately
      const { error } = await supabase
        .from('meeting_backups')
        .insert({
          company_id: profile.company_id,
          meeting_id: meetingId,
          meeting_date: meetingDate,
          backup_type: 'auto',
          data_type: 'full_meeting',
          backup_data: backupData as any,
          created_by: profile.user_id
        });

      if (error) {
        throw error;
      }

      // Also save to localStorage as fallback
      const backupKey = `meeting_backup_${profile.company_id}_${meetingId}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      lastBackupRef.current = backupData;

      // Create audit entry
      await createAuditEntry({
        operation: 'backup',
        tableName: 'meeting_backups',
        meetingId,
        dataSize: JSON.stringify(backupData).length,
        success: true,
        metadata: { backupType: 'auto', dataType: 'full_meeting' }
      });

      console.log('✅ Auto backup created successfully for meeting:', meetingId);
    } catch (error) {
      console.error('Failed to create auto backup:', error);
      
      // Save to localStorage as fallback
      const backupKey = `meeting_backup_${profile.company_id}_${meetingId}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Create audit entry for failure
      await createAuditEntry({
        operation: 'backup',
        tableName: 'meeting_backups',
        meetingId,
        dataSize: JSON.stringify(backupData).length,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      toast.error('Auto-backup failed, but data saved locally');
    }
  }, [profile?.company_id, profile?.user_id, createAuditEntry]);

  // Create manual checkpoint
  const createCheckpoint = useCallback(async (
    dashboardData: any,
    actionsLog: any[],
    keyDocuments: any[],
    meetingId: string,
    meetingDate: string,
    description?: string
  ) => {
    if (!profile?.company_id) return;

    const backupData = {
      timestamp: new Date().toISOString(),
      dashboardData,
      actionsLog,
      keyDocuments,
      meetingId,
      description
    };

    try {
      const { error } = await supabase
        .from('meeting_backups')
        .insert({
          company_id: profile.company_id,
          meeting_id: meetingId,
          meeting_date: meetingDate,
          backup_type: 'checkpoint',
          data_type: 'full_meeting',
          backup_data: backupData as any,
          created_by: profile.user_id,
          metadata: { description } as any
        });

      if (error) throw error;

      await createAuditEntry({
        operation: 'backup',
        tableName: 'meeting_backups',
        meetingId,
        dataSize: JSON.stringify(backupData).length,
        success: true,
        metadata: { backupType: 'checkpoint', description }
      });

      toast.success('Checkpoint created successfully');
      return true;
    } catch (error) {
      console.error('Failed to create checkpoint:', error);
      await createAuditEntry({
        operation: 'backup',
        tableName: 'meeting_backups',
        meetingId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Failed to create checkpoint');
      return false;
    }
  }, [profile?.company_id, profile?.user_id, createAuditEntry]);

  // Restore from backup
  const restoreFromBackup = useCallback(async (backupId: string) => {
    if (!profile?.company_id) return null;

    try {
      const { data, error } = await supabase
        .from('meeting_backups')
        .select('*')
        .eq('id', backupId)
        .eq('company_id', profile.company_id)
        .single();

      if (error) throw error;

      await createAuditEntry({
        operation: 'restore',
        tableName: 'meeting_backups',
        meetingId: data.meeting_id,
        success: true,
        metadata: { backupId, backupType: data.backup_type }
      });

      toast.success('Data restored from backup');
      return data.backup_data;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      await createAuditEntry({
        operation: 'restore',
        tableName: 'meeting_backups',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Failed to restore from backup');
      return null;
    }
  }, [profile?.company_id, createAuditEntry]);

  // Get available backups
  const getAvailableBackups = useCallback(async (meetingId?: string) => {
    if (!profile?.company_id) return [];

    try {
      let query = supabase
        .from('meeting_backups')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (meetingId) {
        query = query.eq('meeting_id', meetingId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
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

  // Get local storage backups (for recovery)
  const getLocalStorageBackups = useCallback(() => {
    if (!profile?.company_id) return [];

    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`meeting_backup_${profile.company_id}_`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          backups.push({
            key,
            meetingId: key.split('_').pop(),
            timestamp: data.timestamp,
            data
          });
        } catch (error) {
          console.error('Failed to parse backup:', key, error);
        }
      }
    }
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [profile?.company_id]);

  // Warn before data loss
  const warnBeforeDataLoss = useCallback((action: string, hasUnsavedChanges: boolean) => {
    if (hasUnsavedChanges) {
      return window.confirm(
        `You have unsaved changes that will be lost if you ${action}. ` +
        'Would you like to continue? Consider creating a checkpoint first.'
      );
    }
    return true;
  }, []);

  return {
    createAutoBackup,
    createCheckpoint,
    restoreFromBackup,
    getAvailableBackups,
    hasDataChanged,
    getLocalStorageBackups,
    warnBeforeDataLoss,
    createAuditEntry
  };
};