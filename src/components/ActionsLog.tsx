import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

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
}

interface ActionsLogProps {
  actions: ActionLogEntry[];
}

export const ActionsLog = ({ actions }: ActionsLogProps) => {
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

  const renderActionsTable = (actionsList: ActionLogEntry[], title: string) => {
    if (actionsList.length === 0) return null;
    
    return (
      <div className="mb-6">
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
                <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Comment</th>
                {title.includes("Closed") && (
                  <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Closed</th>
                )}
              </tr>
            </thead>
            <tbody>
              {actionsList.map((action, index) => (
                <tr key={action.id} className={`border-b border-border/20 hover:bg-gray-50/50 ${action.closed ? 'opacity-75' : ''}`}>
                  <td className="py-3 px-3 text-sm text-foreground">
                    {index + 1}
                  </td>
                  <td className="py-3 px-3 text-sm text-foreground">
                    <div className="max-w-xs">
                      <div className={`font-medium ${action.closed ? 'line-through text-muted-foreground' : ''}`}>
                        {action.action}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        From: {action.itemTitle}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-sm text-foreground">
                    {action.mentionedAttendee}
                  </td>
                  <td className="py-3 px-3 text-sm text-foreground">
                    {new Date(action.dueDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={action.closed ? "green" : (action.status || "green")} />
                  </td>
                  <td className="py-3 px-3 text-sm text-muted-foreground">
                    <div className="max-w-sm truncate">
                      {action.comment}
                    </div>
                  </td>
                  {title.includes("Closed") && (
                    <td className="py-3 px-3 text-sm text-muted-foreground">
                      {action.closedDate ? new Date(action.closedDate).toLocaleDateString('en-GB') : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-border/50">
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-primary" />
          Actions
        </h3>
        <span className="text-sm text-muted-foreground">
          {openActions.length} open, {closedActions.length} closed (30 days)
        </span>
      </div>

      {isExpanded && (
        <div>
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No actions logged yet.</p>
              <p className="text-sm">Actions will appear when attendees are @ mentioned in comments.</p>
            </div>
          ) : (
            <>
              {renderActionsTable(openActions, "Open Actions")}
              {renderActionsTable(closedActions, "Closed Actions (Last 30 Days)")}
              
              {openActions.length === 0 && closedActions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent actions to display.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};