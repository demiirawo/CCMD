import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsRecovery } from './useAnalyticsRecovery';

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  itemTitle: string;
  mentionedAttendee: string;
  comment: string;
  action: string;
  dueDate: string;
  status: 'green' | 'amber' | 'red';
  closed: boolean;
  closedDate?: string;
  sourceType: 'manual' | 'document';
  sourceId?: string;
  auditTrail: any[];
  // Internal tracking
  _lastSaved?: string;
  _lastBackup?: string;
  _version?: number;
}

interface UseRobustActionsLogOptions {
  companyId: string;
  meetingId?: string;
  autoBackupInterval?: number;
  maxRetries?: number;
}

export const useRobustActionsLog = ({
  companyId,
  meetingId,
  autoBackupInterval = 30000,
  maxRetries = 3
}: UseRobustActionsLogOptions) => {
  const [data, setData] = useState<ActionLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveQueue, setSaveQueue] = useState<Array<{ data: ActionLogEntry[]; timestamp: number }>>([]);

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
      createAnalyticsBackup(companyId, meetingId || 'temp', 'actions_log', data, 'auto_backup');
    }, autoBackupInterval);

    return () => clearInterval(interval);
  }, [companyId, meetingId, data, autoBackupInterval, createAnalyticsBackup]);

  // Validate actions log data structure
  const validateActionsLogData = (actionsData: any): ActionLogEntry[] => {
    if (!Array.isArray(actionsData)) return [];
    
    return actionsData.filter(action => 
      action && 
      typeof action === 'object' && 
      typeof action.id === 'string'
    ).map(action => ({
      id: action.id,
      timestamp: action.timestamp || new Date().toISOString(),
      itemTitle: action.itemTitle || '',
      mentionedAttendee: action.mentionedAttendee || '',
      comment: action.comment || '',
      action: action.action || '',
      dueDate: action.dueDate || '',
      status: ['green', 'amber', 'red'].includes(action.status) ? action.status : 'green',
      closed: Boolean(action.closed),
      closedDate: action.closedDate || undefined,
      sourceType: ['manual', 'document'].includes(action.sourceType) ? action.sourceType : 'manual',
      sourceId: action.sourceId || undefined,
      auditTrail: Array.isArray(action.auditTrail) ? action.auditTrail : [],
      _lastSaved: action._lastSaved || new Date().toISOString(),
      _version: (action._version || 0) + 1
    }));
  };

  // Load data with validation and recovery
  const loadData = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data: actionsData, error } = await supabase
        .from('actions_log')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let loadedData: ActionLogEntry[] = [];

      if (actionsData && actionsData.length > 0) {
        loadedData = actionsData.map(record => ({
          id: record.action_id,
          timestamp: record.timestamp,
          itemTitle: record.item_title,
          mentionedAttendee: record.mentioned_attendee,
          comment: record.comment,
          action: record.action_text,
          dueDate: record.due_date,
          status: record.status as 'green' | 'amber' | 'red',
          closed: record.closed,
          closedDate: record.closed_date || undefined,
          sourceType: record.source_type as 'manual' | 'document',
          sourceId: record.source_id || undefined,
          auditTrail: Array.isArray(record.audit_trail) ? record.audit_trail : [],
          _lastSaved: record.updated_at,
          _version: 1
        }));
      }

      // Validate and repair data
      const validatedData = await validateAndRepairData(
        companyId,
        meetingId || 'temp',
        'actions_log',
        loadedData
      );

      setData(validateActionsLogData(validatedData || loadedData));
    } catch (error) {
      console.error('Error loading actions log:', error);
      
      // Attempt recovery from backups
      try {
        const recoveredData = await recoverAnalyticsData(companyId, meetingId || 'temp', 'actions_log');
        if (recoveredData) {
          setData(validateActionsLogData(recoveredData));
          console.log('Successfully recovered actions log data from backup');
        }
      } catch (recoveryError) {
        console.error('Failed to recover actions log data:', recoveryError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, meetingId, validateAndRepairData, recoverAnalyticsData]);

  // Save data with retry logic and backup
  const saveData = useCallback(async (newData: ActionLogEntry[], retryCount = 0) => {
    if (!companyId) return false;

    try {
      // Save each action individually
      for (const action of newData) {
        const { error } = await supabase
          .from('actions_log')
          .upsert({
            action_id: action.id,
            company_id: companyId,
            timestamp: action.timestamp,
            item_title: action.itemTitle,
            mentioned_attendee: action.mentionedAttendee,
            comment: action.comment,
            action_text: action.action,
            due_date: action.dueDate,
            status: action.status,
            closed: action.closed,
            closed_date: action.closedDate,
            source_type: action.sourceType,
            source_id: action.sourceId,
            audit_trail: action.auditTrail,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'action_id'
          });

        if (error) throw error;
      }

      // Create backup after successful save
      await createAnalyticsBackup(companyId, meetingId || 'temp', 'actions_log', newData, 'auto_backup');
      
      setData(newData);
      setSaveQueue(prev => prev.slice(1));
      return true;
    } catch (error) {
      console.error(`Error saving actions log (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        setSaveQueue(prev => [...prev, { data: newData, timestamp: Date.now() }]);
        setTimeout(() => {
          saveData(newData, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      } else {
        console.error('Max retries exceeded for actions log save');
        await createAnalyticsBackup(companyId, meetingId || 'temp', 'actions_log', newData, 'manual_backup');
      }
      return false;
    }
  }, [companyId, meetingId, maxRetries, createAnalyticsBackup]);

  // Update data and trigger save
  const updateData = useCallback(async (updates: ActionLogEntry[]) => {
    const validatedData = validateActionsLogData(updates);
    setData(validatedData);
    
    // Immediate backup
    await createAnalyticsBackup(companyId, meetingId || 'temp', 'actions_log', validatedData, 'manual_backup');
    
    // Async save
    saveData(validatedData);
  }, [companyId, meetingId, createAnalyticsBackup, saveData]);

  // Add new action
  const addAction = useCallback(async (newAction: Omit<ActionLogEntry, 'id' | '_lastSaved' | '_version'>) => {
    const actionWithId: ActionLogEntry = {
      ...newAction,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      _lastSaved: new Date().toISOString(),
      _version: 1
    };

    const newData = [actionWithId, ...data];
    await updateData(newData);
  }, [data, updateData]);

  // Update specific action
  const updateAction = useCallback(async (actionId: string, updates: Partial<ActionLogEntry>) => {
    const newData = data.map(action => {
      if (action.id === actionId) {
        return {
          ...action,
          ...updates,
          _lastSaved: new Date().toISOString(),
          _version: (action._version || 0) + 1
        };
      }
      return action;
    });

    await updateData(newData);
  }, [data, updateData]);

  // Force recovery from backups
  const forceRecovery = useCallback(async () => {
    try {
      const recoveredData = await recoverAnalyticsData(companyId, meetingId || 'temp', 'actions_log');
      if (recoveredData) {
        setData(validateActionsLogData(recoveredData));
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
    addAction,
    updateAction,
    saveData,
    forceRecovery,
    recoveryState,
    saveQueue: saveQueue.length
  };
};