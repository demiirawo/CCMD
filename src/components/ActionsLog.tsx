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
}

interface ActionsLogProps {
  actions: ActionLogEntry[];
}

export const ActionsLog = ({ actions }: ActionsLogProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

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
          {actions.length} action{actions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No actions logged yet.</p>
              <p className="text-sm">Actions will appear when attendees are @ mentioned in comments.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">ID</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Description</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Owner</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Due Date</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold text-foreground">Comment</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action, index) => (
                  <tr key={action.id} className="border-b border-border/20 hover:bg-gray-50/50">
                    <td className="py-3 px-3 text-sm text-foreground">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 text-sm text-foreground">
                      <div className="max-w-xs">
                        <div className="font-medium">{action.action}</div>
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
                      <StatusBadge status={action.status || "green"} />
                    </td>
                    <td className="py-3 px-3 text-sm text-muted-foreground">
                      <div className="max-w-sm truncate">
                        {action.comment}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};