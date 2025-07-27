import { useState } from "react";
import { AlertCircle, Check, Minus } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
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
}
interface ActionsLogProps {
  actions: ActionLogEntry[];
  onActionComplete?: (actionId: string) => void;
  onActionDelete?: (actionId: string) => void;
  onResetActions?: () => void;
}
export const ActionsLog = ({
  actions,
  onActionComplete,
  onActionDelete,
  onResetActions
}: ActionsLogProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

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
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getActionRowClass = (action: ActionLogEntry): string => {
    if (action.closed) return '';
    
    const daysRemaining = getDaysRemaining(action.dueDate);
    
    if (daysRemaining < 0) {
      return 'bg-red-50 border-l-4 border-l-red-500'; // Overdue
    } else if (daysRemaining <= 7) {
      return 'bg-amber-50 border-l-4 border-l-amber-500'; // Due within a week
    } else if (daysRemaining <= 30) {
      return 'bg-blue-50 border-l-4 border-l-blue-500'; // Due within a month
    }
    return '';
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
                      <div className={`font-medium break-words whitespace-pre-wrap ${action.closed ? 'line-through text-muted-foreground' : ''}`}>
                        {action.action}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 break-words">
                        From: {action.itemTitle}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-foreground">
                    {action.mentionedAttendee}
                  </td>
                   <td className="py-3 px-3 text-sm text-foreground">
                     <div className="flex items-center gap-2">
                       <span>{action.dueDate}</span>
                       {!action.closed && (
                         <span className={`text-xs px-2 py-1 rounded-full ${
                           getDaysRemaining(action.dueDate) < 0 
                             ? 'bg-red-100 text-red-700' 
                             : getDaysRemaining(action.dueDate) <= 7 
                               ? 'bg-amber-100 text-amber-700'
                               : getDaysRemaining(action.dueDate) <= 30
                                 ? 'bg-blue-100 text-blue-700'
                                 : 'bg-gray-100 text-gray-700'
                         }`}>
                           {getDaysRemaining(action.dueDate) < 0 
                             ? `${Math.abs(getDaysRemaining(action.dueDate))} days overdue`
                             : getDaysRemaining(action.dueDate) === 0 
                               ? 'Due today'
                               : `${getDaysRemaining(action.dueDate)} days left`
                           }
                         </span>
                       )}
                     </div>
                   </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
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
  return <div className="bg-white rounded-2xl p-6 shadow-lg border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Actions
          </h3>
          <span className="text-sm text-muted-foreground">
            {openActions.length} open, {closedActions.length} closed (30 days)
          </span>
        </div>
        {onResetActions && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onResetActions}
            className="text-red-600 hover:bg-red-50 border-red-200"
          >
            Reset All
          </Button>
        )}
      </div>

      {isExpanded && <div>
          {actions.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              <p>No actions logged yet.</p>
              <p className="text-sm">
        </p>
            </div> : <>
              {renderActionsTable(openActions, "Open Actions")}
              {renderActionsTable(closedActions, "Closed Actions (Last 30 Days)")}
              
              {openActions.length === 0 && closedActions.length === 0 && <div className="text-center py-8 text-muted-foreground">
                  <p>No recent actions to display.</p>
                </div>}
            </>}
        </div>}
    </div>;
};