import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface ActionItem {
  id: string;
  action_id: string;
  company_id: string;
  item_title: string;
  mentioned_attendee: string;
  comment: string;
  action_text: string;
  due_date: string;
  status: string;
  closed: boolean;
  closed_date?: string;
  source_type?: string;
  source_id?: string;
  session_id?: string;
  audit_trail?: any;
  created_at: string;
  updated_at: string;
}

interface UseActionsOptions {
  sessionId?: string;
  sourceId?: string;
  sourceType?: 'manual' | 'document';
}

export const useActions = (options: UseActionsOptions = {}) => {
  const { profile } = useAuth();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch actions from database
  const fetchActions = useCallback(async () => {
    if (!profile?.company_id) return;

    try {
      let query = supabase
        .from('actions_log')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('due_date', { ascending: true });

      // Apply filters if provided
      if (options.sessionId) {
        query = query.eq('session_id', options.sessionId);
      }
      if (options.sourceId) {
        query = query.eq('source_id', options.sourceId);
      }
      if (options.sourceType) {
        query = query.eq('source_type', options.sourceType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching actions:', error);
        toast({
          title: "Error loading actions",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setActions(data || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id, options.sessionId, options.sourceId, options.sourceType]);

  // Create new action
  const createAction = useCallback(async (actionData: {
    itemTitle: string;
    mentionedAttendee: string;
    comment: string;
    actionText: string;
    dueDate: string;
    sessionId?: string;
    sourceId?: string;
    sourceType?: 'manual' | 'document';
  }) => {
    if (!profile?.company_id) return null;

    try {
      const newAction = {
        action_id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        company_id: profile.company_id,
        item_title: actionData.itemTitle,
        mentioned_attendee: actionData.mentionedAttendee,
        comment: actionData.comment,
        action_text: actionData.actionText,
        due_date: actionData.dueDate,
        status: 'green',
        closed: false,
        source_type: actionData.sourceType || 'manual',
        source_id: actionData.sourceId || '',
        session_id: actionData.sessionId || '',
        timestamp: new Date().toISOString(),
        audit_trail: []
      };

      const { data, error } = await supabase
        .from('actions_log')
        .insert(newAction)
        .select()
        .single();

      if (error) {
        console.error('Error creating action:', error);
        toast({
          title: "Error creating action",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      // Update local state
      setActions(prev => [...prev, data]);
      
      toast({
        title: "Action created",
        description: `Action assigned to ${actionData.mentionedAttendee}`,
      });

      return data;
    } catch (error) {
      console.error('Error creating action:', error);
      return null;
    }
  }, [profile?.company_id]);

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
      const auditEntries = [...(action.audit_trail || [])];
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

      if (updates.action && updates.action !== action.action_text) {
        auditEntries.push({
          timestamp,
          change: `Action Description Changed`,
          user: currentUser
        });
        updateData.action_text = updates.action;
      }

      if (updates.dueDate && updates.dueDate !== action.due_date) {
        auditEntries.push({
          timestamp,
          change: `Action Due Date Changed: from ${action.due_date} to ${updates.dueDate}`,
          user: currentUser
        });
        updateData.due_date = updates.dueDate;
      }

      if (updates.owner && updates.owner !== action.mentioned_attendee) {
        auditEntries.push({
          timestamp,
          change: `Action Owner Changed: from ${action.mentioned_attendee} to ${updates.owner}`,
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

      // Update local state
      setActions(prev => 
        prev.map(a => 
          a.id === actionId 
            ? { ...a, ...updateData }
            : a
        )
      );

      toast({
        title: "Action updated",
        description: "Action has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating action:', error);
    }
  }, [actions, profile?.username]);

  // Complete action
  const completeAction = useCallback(async (actionId: string) => {
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

      // Update local state
      setActions(prev =>
        prev.map(a =>
          a.id === actionId
            ? { 
                ...a, 
                closed: true, 
                closed_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            : a
        )
      );

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

      // Update local state
      setActions(prev => prev.filter(a => a.id !== actionId));

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

      // Update local state
      setActions(prev =>
        prev.map(a =>
          a.id === actionId
            ? { 
                ...a, 
                closed: false, 
                closed_date: undefined,
                updated_at: new Date().toISOString()
              }
            : a
        )
      );

      toast({
        title: "Action reopened",
        description: "Action has been reopened",
      });
    } catch (error) {
      console.error('Error reopening action:', error);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return {
    actions,
    loading,
    createAction,
    updateAction,
    completeAction,
    deleteAction,
    reopenAction,
    refetch: fetchActions
  };
};