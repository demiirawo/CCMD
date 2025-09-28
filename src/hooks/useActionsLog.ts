import { useActions } from './useActions';
import { useAuth } from './useAuth';

// Hook specifically for the Actions Log component to get all actions without filters
export const useActionsLog = () => {
  const { profile } = useAuth();
  const { 
    actions: allActions, 
    loading, 
    updateAction,
    completeAction,
    deleteAction,
    reopenAction,
    refetch
  } = useActions(); // No filters - get all actions for the company

  // Transform actions to match the ActionLogEntry interface expected by ActionsLog
  const actions = allActions.map(action => ({
    id: action.action_id,
    timestamp: action.created_at,
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
    auditTrail: action.audit_trail || []
  }));

  // Wrapper functions to handle the ID transformation
  const handleActionComplete = async (actionId: string) => {
    const dbAction = allActions.find(a => a.action_id === actionId);
    if (dbAction) {
      await completeAction(dbAction.id);
    }
  };

  const handleActionDelete = async (actionId: string) => {
    const dbAction = allActions.find(a => a.action_id === actionId);
    if (dbAction) {
      await deleteAction(dbAction.id);
    }
  };

  const handleActionUndo = async (actionId: string) => {
    const dbAction = allActions.find(a => a.action_id === actionId);
    if (dbAction) {
      await reopenAction(dbAction.id);
    }
  };

  const handleActionEdit = async (actionId: string, updates: {
    comment?: string;
    dueDate?: string;
    owner?: string;
    action?: string;
  }) => {
    const dbAction = allActions.find(a => a.action_id === actionId);
    if (dbAction) {
      await updateAction(dbAction.id, updates);
    }
  };

  return {
    actions,
    loading,
    onActionComplete: handleActionComplete,
    onActionDelete: handleActionDelete,
    onActionUndo: handleActionUndo,
    onActionEdit: handleActionEdit,
    refetch
  };
};