import { useState } from "react";
import { AlertCircle, Clock, User } from "lucide-react";

export interface ActionLogEntry {
  id: string;
  timestamp: string;
  itemTitle: string;
  mentionedAttendee: string;
  comment: string;
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
          Actions Log
        </h3>
        <span className="text-sm text-muted-foreground">
          {actions.length} action{actions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {isExpanded && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No actions logged yet.</p>
              <p className="text-sm">Actions will appear when attendees are @ mentioned in comments.</p>
            </div>
          ) : (
            actions.map((action) => (
              <div key={action.id} className="bg-gray-50 rounded-lg p-4 border border-border/30">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">
                        @{action.mentionedAttendee}
                      </span>
                      <span className="text-xs text-muted-foreground">mentioned in</span>
                      <span className="font-medium text-sm text-foreground truncate">
                        {action.itemTitle}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {action.comment}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {action.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};