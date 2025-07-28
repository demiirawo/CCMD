import { useState } from "react";
import { AlertCircle, Check, Minus, Edit, ChevronDown, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
import { ActionEditDialog } from "./ActionEditDialog";

export interface AuditEntry {
  timestamp: string;
  change: string;
}

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
  sourceType?: "document" | "manual"; // Track if action came from document review
  sourceId?: string; // ID of the source document if applicable
  auditTrail?: AuditEntry[]; // New audit trail
}

interface ActionsLogProps {
  actions: ActionLogEntry[];
  onActionComplete?: (actionId: string) => void;
  onActionDelete?: (actionId: string) => void;
  onResetActions?: () => void;
  onActionEdit?: (actionId: string, updates: {
    comment?: string;
    dueDate?: string;
    owner?: string;
  }) => void;
  attendees?: string[];
}

export const ActionsLog = ({
  actions,
  onActionComplete,
  onActionDelete,
  onResetActions,
  onActionEdit,
  attendees = []
}: ActionsLogProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = sessionStorage.getItem('actions_log_expanded');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [editingAction, setEditingAction] = useState<ActionLogEntry | null>(null);

  // Group actions by open/closed
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const openActions = actions.filter(action => !action.closed);
  const closedActions = actions.filter(action => {
    if (!action.closed || !action.closedDate) return false;
    const closedDate = new Date(action.closedDate);
    return closedDate >= thirtyDaysAgo;
  });

  // Function to calculate days remaining and get color
  const getDaysRemaining = (dueDate: string): number => {
    if (!dueDate || dueDate.trim() === '') return 0;
    let due: Date;

    // Handle DD/MM/YYYY format (e.g., "28/07/2026")
    if (dueDate.includes('/') && dueDate.split('/').length === 3) {
      const parts = dueDate.split('/');
      if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
        // DD/MM/YYYY format - convert to YYYY-MM-DD
        const [day, month, year] = parts;
        due = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      } else {
        // Try standard parsing
        due = new Date(dueDate);
      }
    } else {
      // Try standard parsing
      due = new Date(dueDate);
    }
    const today = new Date();

    // Check if date is valid
    if (isNaN(due.getTime())) {
      console.warn('Invalid due date after parsing:', dueDate);
      return 0;
    }
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 0 : diffDays;
  };
  const getActionRowClass = (action: ActionLogEntry): string => {
    if (action.closed) return '';
    const daysRemaining = getDaysRemaining(action.dueDate);
    if (daysRemaining < 0) {
      return 'bg-red-50 border-l-4 border-l-red-500'; // Overdue
    } else if (daysRemaining <= 5) {
      return 'bg-amber-50 border-l-4 border-l-amber-500'; // Due within 5 days
    } else {
      return 'bg-green-50 border-l-4 border-l-green-500'; // More than 5 days
    }
  };
  const renderActionsTable = (actionsList: ActionLogEntry[], title: string) => {
    if (actionsList.length === 0) return null;
    return <div className="mb-6">
        <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          {title}
          <span className="text-sm text-muted-foreground font-normal">
            ({actionsList.length})
          </span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">ID</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Description</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Owner</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Due Date</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Actions</th>
                {title.includes("Closed") && <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Closed</th>}
              </tr>
            </thead>
            <tbody>
              {actionsList.map((action, index) => <tr key={action.id} className={`border-b border-border/20 hover:bg-gray-50/50 ${action.closed ? 'opacity-75' : ''} ${getActionRowClass(action)}`}>
                  <td className="py-3 px-3 text-sm text-foreground">
                    {index + 1}
                  </td>
                  <td className="py-3 px-3 text-sm text-foreground">
                    <div className="min-w-0 max-w-md">
                      <div className={`font-medium break-words whitespace-pre-wrap ${action.closed ? 'text-muted-foreground' : ''}`}>
                        {action.action}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 break-words">
                        From: {action.itemTitle}
                      </div>
                      {/* Show full audit trail */}
                      {action.auditTrail && action.auditTrail.length > 0 && <div className="text-xs mt-2 space-y-1">
                          {action.auditTrail.map((entry, entryIndex) => <div key={entryIndex} className="text-blue-600 bg-blue-50 p-1 rounded border-l-2 border-blue-200">
                              <span className="font-medium">{entry.timestamp}:</span> {entry.change}
                            </div>)}
                        </div>}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-foreground">
                    {action.mentionedAttendee}
                  </td>
                  <td className="py-3 px-3 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{action.dueDate}</span>
                      {!action.closed && <span className={`text-xs px-2 py-1 rounded-full ${getDaysRemaining(action.dueDate) < 0 ? 'bg-red-100 text-red-700' : getDaysRemaining(action.dueDate) <= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {(() => {
                      const days = getDaysRemaining(action.dueDate);
                      if (days < 0) {
                        return `${Math.abs(days)} day(s) overdue`;
                      } else if (days === 0) {
                        return 'Due today';
                      } else {
                        return `${days} day(s) left`;
                      }
                    })()}
                        </span>}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      {!action.closed && onActionEdit && action.sourceType !== "document" && <Button variant="ghost" size="sm" onClick={() => setEditingAction(action)} className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-100" title="Edit action">
                          <Edit className="h-4 w-4" />
                        </Button>}
                      <Button variant="ghost" size="sm" onClick={() => onActionComplete?.(action.id)} disabled={action.closed} className={`h-8 w-8 p-0 ${action.closed ? 'opacity-50' : 'hover:bg-green-100'}`} title="Mark as completed">
                        <Check className={`h-4 w-4 ${action.closed ? 'text-green-600' : 'text-muted-foreground'}`} />
                      </Button>
                      {!action.closed && <Button variant="ghost" size="sm" onClick={() => onActionDelete?.(action.id)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-100" title="Delete action">
                          <Minus className="h-4 w-4" />
                        </Button>}
                    </div>
                  </td>
                  {title.includes("Closed") && <td className="py-3 px-3 text-sm text-muted-foreground">
                      {action.closedDate ? new Date(action.closedDate).toLocaleDateString('en-GB') : '-'}
                    </td>}
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>;
  };
  return <div className="bg-primary/10 rounded-2xl p-6 shadow-lg border border-border/50 -mx-8 px-14">
      <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        sessionStorage.setItem('actions_log_expanded', JSON.stringify(newState));
      }}>
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            
            Actions
          </h3>
          <span className="text-sm text-muted-foreground">
            {openActions.length} open, {closedActions.length} closed (30 days)
          </span>
        </div>
        <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors">
          {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
        </div>
      </div>

      {isExpanded && <div>
          {actions.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              <p>No actions logged yet.</p>
            </div> : <>
              {renderActionsTable(openActions, "Open Actions")}
              {renderActionsTable(closedActions, "Closed Actions (Last 30 Days)")}
              
              {openActions.length === 0 && closedActions.length === 0 && <div className="text-center py-8 text-muted-foreground">
                  <p>No recent actions to display.</p>
                </div>}
            </>}
        </div>}
      
      <ActionEditDialog isOpen={!!editingAction} onClose={() => setEditingAction(null)} action={editingAction} onSave={(actionId, updates) => {
      onActionEdit?.(actionId, updates);
      setEditingAction(null);
    }} />
    </div>;
};
