import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  itemTitle: string;
  mentionedAttendee: string;
  comment: string;
  action: string;
  dueDate: string;
  status?: "green" | "amber" | "red";
  closed?: boolean;
  closedDate?: string;
  sourceType?: "document" | "manual";
  sourceId?: string;
  auditTrail?: any[];
}

export const useActionsLog = () => {
  const { profile } = useAuth();
  const [actions, setActions] = useState<ActionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all actions for the actions log (including closed ones)
  const fetchActions = useCallback(async () => {
    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    console.log('Fetching actions log for company:', profile.company_id);
    
    try {
      const { data, error } = await supabase
        .from('actions_log')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching actions log:', error);
        toast({
          title: "Error loading actions",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Convert database format to ActionsLog format
      const convertedActions: ActionLogEntry[] = (data || []).map(action => ({
        id: action.id,
        timestamp: action.timestamp || action.created_at,
        itemTitle: action.item_title,
        mentionedAttendee: action.mentioned_attendee,
        comment: action.comment,
        action: action.action_text,
        dueDate: action.due_date,
        status: action.status as "green" | "amber" | "red",
        closed: action.closed,
        closedDate: action.closed_date,
        sourceType: action.source_type as "document" | "manual",
        sourceId: action.source_id,
        auditTrail: Array.isArray(action.audit_trail) ? action.audit_trail : []
      }));

      console.log('Fetched actions log:', convertedActions);
      setActions(convertedActions);
    } catch (error) {
      console.error('Error fetching actions log:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id]);

  // Complete action
  const completeAction = useCallback(async (actionId: string) => {
    console.log('Completing action in actions log:', actionId);
    try {
      const { error } = await supabase
        .from('actions_log')
        .update({
          closed: true,
          closed_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId);

      if (error) {
        console.error('Error completing action:', error);
        toast({
          title: "Error completing action",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Action completed",
        description: "Action has been marked as completed",
      });
    } catch (error) {
      console.error('Error completing action:', error);
    }
  }, []);

  // Delete action
  const deleteAction = useCallback(async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('actions_log')
        .delete()
        .eq('id', actionId);

      if (error) {
        console.error('Error deleting action:', error);
        toast({
          title: "Error deleting action",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Action deleted",
        description: "Action has been deleted",
      });
    } catch (error) {
      console.error('Error deleting action:', error);
    }
  }, []);

  // Reopen action
  const reopenAction = useCallback(async (actionId: string) => {
    try {
      const { error } = await supabase
        .from('actions_log')
        .update({
          closed: false,
          closed_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId);

      if (error) {
        console.error('Error reopening action:', error);
        toast({
          title: "Error reopening action",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Action reopened",
        description: "Action has been reopened",
      });
    } catch (error) {
      console.error('Error reopening action:', error);
    }
  }, []);

  // Update action
  const updateAction = useCallback(async (actionId: string, updates: {
    comment?: string;
    dueDate?: string;
    owner?: string;
    action?: string;
  }) => {
    if (!profile?.company_id) return;

    try {
      const action = actions.find(a => a.id === actionId);
      if (!action) return;

      // Build audit trail entries
      const auditEntries = [...(action.auditTrail || [])];
      const timestamp = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      const currentUser = profile?.username || 'Unknown';

      // Prepare update data
      const updateData: any = {};

      if (updates.comment) {
        auditEntries.push({
          timestamp,
          change: `Audit Comment Added: "${updates.comment}"`,
          user: currentUser
        });
      }

      if (updates.action && updates.action !== action.action) {
        auditEntries.push({
          timestamp,
          change: `Action Description Changed`,
          user: currentUser
        });
        updateData.action_text = updates.action;
      }

      if (updates.dueDate && updates.dueDate !== action.dueDate) {
        auditEntries.push({
          timestamp,
          change: `Action Due Date Changed: from ${action.dueDate} to ${updates.dueDate}`,
          user: currentUser
        });
        updateData.due_date = updates.dueDate;
      }

      if (updates.owner && updates.owner !== action.mentionedAttendee) {
        auditEntries.push({
          timestamp,
          change: `Action Owner Changed: from ${action.mentionedAttendee} to ${updates.owner}`,
          user: currentUser
        });
        updateData.mentioned_attendee = updates.owner;
      }

      updateData.audit_trail = auditEntries;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('actions_log')
        .update(updateData)
        .eq('id', actionId);

      if (error) {
        console.error('Error updating action:', error);
        toast({
          title: "Error updating action",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Action updated",
        description: "Action has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating action:', error);
    }
  }, [actions, profile?.username, profile?.company_id]);

  // Initialize data and set up real-time subscription
  useEffect(() => {
    fetchActions();

    // Set up real-time subscription for actions_log table
    const subscription = supabase
      .channel('actions-log-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'actions_log',
          filter: `company_id=eq.${profile?.company_id}`
        },
        (payload) => {
          console.log('Real-time action log change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newAction = payload.new as any;
            const convertedAction: ActionLogEntry = {
              id: newAction.id,
              timestamp: newAction.timestamp || newAction.created_at,
              itemTitle: newAction.item_title,
              mentionedAttendee: newAction.mentioned_attendee,
              comment: newAction.comment,
              action: newAction.action_text,
              dueDate: newAction.due_date,
              status: newAction.status as "green" | "amber" | "red",
              closed: newAction.closed,
              closedDate: newAction.closed_date,
              sourceType: newAction.source_type as "document" | "manual",
              sourceId: newAction.source_id,
              auditTrail: Array.isArray(newAction.audit_trail) ? newAction.audit_trail : []
            };
            setActions(prev => [...prev, convertedAction]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedAction = payload.new as any;
            const convertedAction: ActionLogEntry = {
              id: updatedAction.id,
              timestamp: updatedAction.timestamp || updatedAction.created_at,
              itemTitle: updatedAction.item_title,
              mentionedAttendee: updatedAction.mentioned_attendee,
              comment: updatedAction.comment,
              action: updatedAction.action_text,
              dueDate: updatedAction.due_date,
              status: updatedAction.status as "green" | "amber" | "red",
              closed: updatedAction.closed,
              closedDate: updatedAction.closed_date,
              sourceType: updatedAction.source_type as "document" | "manual",
              sourceId: updatedAction.source_id,
              auditTrail: Array.isArray(updatedAction.audit_trail) ? updatedAction.audit_trail : []
            };
            setActions(prev => 
              prev.map(a => a.id === convertedAction.id ? convertedAction : a)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedAction = payload.old as any;
            setActions(prev => prev.filter(a => a.id !== deletedAction.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchActions, profile?.company_id]);

  return {
    actions,
    loading,
    completeAction,
    deleteAction,
    reopenAction,
    updateAction,
    refetch: fetchActions
  };
};