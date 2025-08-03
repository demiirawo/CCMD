import { useState, useEffect } from "react";
import { AlertCircle, Check, Minus, Edit, ChevronDown, ChevronRight, Copy, RotateCcw } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
import { ActionEditDialog } from "./ActionEditDialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
  onActionUndo?: (actionId: string) => void;
  onResetActions?: () => void;
  onActionEdit?: (actionId: string, updates: {
    comment?: string;
    dueDate?: string;
    owner?: string;
  }) => void;
  attendees?: string[];
  forceOpen?: boolean;
  onPanelStateChange?: () => void;
  panelStateTracker?: number;
  readOnly?: boolean;
  currentUsername?: string;
}

export const ActionsLog = ({
  actions,
  onActionComplete,
  onActionDelete,
  onActionUndo,
  onResetActions,
  onActionEdit,
  attendees = [],
  forceOpen,
  onPanelStateChange,
  panelStateTracker,
  readOnly = false,
  currentUsername
}: ActionsLogProps) => {
  const { companies, profile } = useAuth();
  const currentCompany = companies.find(c => c.id === profile?.company_id);
  const isDynamicPanelColourEnabled = true;
  
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = sessionStorage.getItem('actions_log_expanded');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  // Listen for panel state changes to sync with sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('actions_log_expanded');
    const savedState = saved !== null ? JSON.parse(saved) : false;
    if (savedState !== isExpanded) {
      setIsExpanded(savedState);
    }
  }, [panelStateTracker, isExpanded]);
  
  const isOpen = isExpanded;
  const [editingAction, setEditingAction] = useState<ActionLogEntry | null>(null);

  // Group actions by open/closed and sort by due date (soonest first)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const sortByDueDate = (a: ActionLogEntry, b: ActionLogEntry) => {
    const parseDueDate = (dueDate: string): Date => {
      if (!dueDate || dueDate.trim() === '') return new Date('9999-12-31');
      
      // Handle DD/MM/YYYY format (e.g., "28/07/2026")
      if (dueDate.includes('/') && dueDate.split('/').length === 3) {
        const parts = dueDate.split('/');
        if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
          // DD/MM/YYYY format - convert to YYYY-MM-DD
          const [day, month, year] = parts;
          return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      }
      // Try standard parsing
      return new Date(dueDate);
    };
    
    const aDueDate = parseDueDate(a.dueDate || '');
    const bDueDate = parseDueDate(b.dueDate || '');
    
    // Sort by date ascending (overdue and soonest first)
    return aDueDate.getTime() - bDueDate.getTime();
  };
  
  // Group open actions by current user vs team
  const allOpenActions = actions
    .filter(action => !action.closed)
    .sort(sortByDueDate);
    
  const myActions = allOpenActions.filter(action => 
    currentUsername && action.mentionedAttendee === currentUsername
  );
  
  const officeTeamActions = allOpenActions.filter(action => 
    !currentUsername || action.mentionedAttendee !== currentUsername
  );
  
  const openActions = allOpenActions; // Keep for compatibility with existing summary
    
  const closedActions = actions
    .filter(action => {
      if (!action.closed || !action.closedDate) return false;
      const closedDate = new Date(action.closedDate);
      return closedDate >= thirtyDaysAgo;
    })
    .sort(sortByDueDate);

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

  // Calculate overall status for background color
  const getOverallActionStatus = (): 'green' | 'amber' | 'red' => {
    const activeActions = actions.filter(action => !action.closed);
    
    // Check if any actions are overdue (red)
    const hasOverdue = activeActions.some(action => {
      const daysRemaining = getDaysRemaining(action.dueDate);
      return daysRemaining < 0;
    });
    
    if (hasOverdue) return 'red';
    
    // Check if any actions are due soon (amber)
    const hasDueSoon = activeActions.some(action => {
      const daysRemaining = getDaysRemaining(action.dueDate);
      return daysRemaining >= 0 && daysRemaining <= 5;
    });
    
    if (hasDueSoon) return 'amber';
    
    // Default to green if no overdue or due soon actions
    return 'green';
  };

  const overallStatus = getOverallActionStatus();

  // Function to copy actions in a nicely formatted way
  const copyActionsToClipboard = async () => {
    const formatAction = (action: ActionLogEntry, index: number): string => {
      const status = action.closed ? 'Closed' : (() => {
        const days = getDaysRemaining(action.dueDate);
        if (days < 0) return `${Math.abs(days)} day(s) overdue`;
        if (days === 0) return 'Due today';
        return `${days} day(s) left`;
      })();
      
      return `${index + 1}. ${action.action}
   Owner: ${action.mentionedAttendee}
   Due Date: ${action.dueDate}
   Status: ${status}`;
    };

    let formattedText = 'ACTIONS LOG\n\n';
    
    if (openActions.length > 0) {
      formattedText += `OPEN ACTIONS (${openActions.length})\n`;
      formattedText += '=' .repeat(20) + '\n';
      openActions.forEach((action, index) => {
        formattedText += formatAction(action, index) + '\n\n';
      });
    }
    
    if (closedActions.length > 0) {
      formattedText += `CLOSED ACTIONS - LAST 30 DAYS (${closedActions.length})\n`;
      formattedText += '=' .repeat(35) + '\n';
      closedActions.forEach((action, index) => {
        formattedText += formatAction(action, index) + 
          `\n   Closed: ${action.closedDate ? new Date(action.closedDate).toLocaleDateString('en-GB') : 'N/A'}\n\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(formattedText);
      // You can add a toast notification here if needed
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };
  
  // Get background class with dynamic panel colour support
  const getBackgroundClass = () => {
    if (isDynamicPanelColourEnabled) {
      switch (overallStatus) {
        case 'green':
          return 'bg-status-green text-white';
        case 'amber':
          return 'bg-status-amber text-white';
        case 'red':
          return 'bg-status-red text-white';
        default:
          return 'bg-primary/10';
      }
    }
    return 'bg-primary/10';
  };
  const getActionRowClass = (action: ActionLogEntry): string => {
    if (action.closed) return '';
    const daysRemaining = getDaysRemaining(action.dueDate);
    if (daysRemaining < 0) {
      return 'bg-red-100 border border-red-300 text-red-900'; // Overdue
    } else if (daysRemaining <= 5) {
      return 'bg-amber-100 border border-amber-300 text-amber-900'; // Due within 5 days
    } else {
      return 'bg-green-100 border border-green-300 text-green-900'; // More than 5 days
    }
  };
  const renderActionsTable = (actionsList: ActionLogEntry[], title: string) => {
    if (actionsList.length === 0) return null;
    return <div className="mb-6">
        <h4 className={cn(
          "text-lg font-semibold mb-3 flex items-center gap-2",
          isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
        )}>
          {title}
          <span className={cn(
            "text-sm font-normal",
            isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
          )}>
            ({actionsList.length})
          </span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className={cn(
                  "text-left py-2 px-3 text-sm font-semibold",
                  isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
                )}>ID</th>
                <th className={cn(
                  "text-left py-2 px-3 text-sm font-semibold",
                  isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
                )}>Description</th>
                <th className={cn(
                  "text-left py-2 px-3 text-sm font-semibold",
                  isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
                )}>Owner</th>
                <th className={cn(
                  "text-left py-2 px-3 text-sm font-semibold",
                  isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
                )}>Due Date</th>
                {title.includes("Closed") && <th className={cn(
                  "text-left py-2 px-3 text-sm font-semibold",
                  isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
                )}>Closed</th>}
                <th className={cn(
                  "text-left py-2 px-3 text-sm font-semibold",
                  isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
                )}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {actionsList.map((action, index) => <tr key={action.id} className={cn(
                `border-b border-border/20`,
                action.closed ? 'bg-stone-50' : '',
                getActionRowClass(action)
              )}>
                  <td className={cn(
                    "py-3 px-3 text-sm",
                    action.closed ? "text-black" :
                    getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                    getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                    "text-green-900"
                  )}>
                    {index + 1}
                  </td>
                  <td className={cn(
                    "py-3 px-3 text-sm",
                    action.closed ? "text-black" :
                    getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                    getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                    "text-green-900"
                  )}>
                    <div className="min-w-0 max-w-md">
                      <div className={cn(
                        "font-medium break-words whitespace-pre-wrap",
                        action.closed ? "text-black" :
                        getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                        getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                        "text-green-900"
                      )}>
                        {action.action}
                      </div>
                      <div className={cn(
                        "text-xs mt-1 break-words",
                        action.closed ? "text-black/80" :
                        getDaysRemaining(action.dueDate) < 0 ? "text-red-700" :
                        getDaysRemaining(action.dueDate) <= 5 ? "text-amber-700" : 
                        "text-green-700"
                      )}>
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
                  <td className={cn(
                    "py-3 px-3 text-sm",
                    action.closed ? "text-black" :
                    getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                    getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                    "text-green-900"
                  )}>
                    {action.mentionedAttendee}
                  </td>
                  <td className={cn(
                    "py-3 px-3 text-sm",
                    action.closed ? "text-black" :
                    getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                    getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                    "text-green-900"
                  )}>
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
                  {title.includes("Closed") && <td className={cn(
                    "py-3 px-3 text-sm",
                    action.closed ? "text-black/80" :
                    isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
                  )}>
                      {action.closedDate ? new Date(action.closedDate).toLocaleDateString('en-GB') : '-'}
                    </td>}
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      {!action.closed && onActionEdit && action.sourceType !== "document" && <Button variant="ghost" size="sm" onClick={() => setEditingAction(action)} className="h-8 w-8 p-0 text-black hover:bg-gray-50" title="Edit action">
                          <Edit className="h-4 w-4 text-black" />
                        </Button>}
                      {action.closed && onActionUndo && !readOnly && <Button variant="ghost" size="sm" onClick={() => onActionUndo(action.id)} className="h-8 w-8 p-0 text-black hover:bg-gray-50" title="Undo - reopen this action">
                          <RotateCcw className="h-4 w-4 text-black" />
                        </Button>}
                      <Button variant="ghost" size="sm" onClick={() => onActionComplete?.(action.id)} disabled={action.closed} className={cn(
                        "h-8 w-8 p-0",
                        action.closed ? "opacity-50" : "hover:bg-gray-50"
                      )} title="Mark as completed">
                        <Check className={cn(
                          "h-4 w-4",
                          action.closed ? "text-green-600" : "text-black"
                        )} />
                      </Button>
                      {!action.closed && <Button variant="ghost" size="sm" onClick={() => onActionDelete?.(action.id)} className="h-8 w-8 p-0 text-black hover:bg-gray-50" title="Delete action">
                          <Minus className="h-4 w-4 text-black" />
                        </Button>}
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>;
  };
  return <div className={`rounded-2xl p-6 shadow-lg -mx-8 px-14 outline-none ${getBackgroundClass()}`}>
      <div className="flex items-center justify-between cursor-pointer mb-6 outline-none" onClick={() => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        sessionStorage.setItem('actions_log_expanded', JSON.stringify(newState));
        onPanelStateChange?.();
      }}>
        <div className="flex items-center gap-3">
          <div>
            <h3 className={cn(
              "text-xl font-bold flex items-center gap-2",
              isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
            )}>
              Actions
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyActionsToClipboard();
                }}
                className={cn(
                  "h-6 w-6 p-0 hover:bg-white/20",
                  isDynamicPanelColourEnabled ? "text-white/80 hover:text-white" : "text-foreground"
                )}
                title="Copy actions log to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </h3>
            <p className={cn(
              "text-sm",
              isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
            )}>
              {(() => {
                const overdueActions = openActions.filter(action => getDaysRemaining(action.dueDate) < 0);
                const inProgressActions = openActions.filter(action => getDaysRemaining(action.dueDate) >= 0);
                return `${inProgressActions.length} in progress, ${overdueActions.length} overdue`;
              })()}
            </p>
          </div>
        </div>
        <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors outline-none">
          {isOpen ? (
            <ChevronDown className={cn(
              "w-5 h-5",
              isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
            )} />
          ) : (
            <ChevronRight className={cn(
              "w-5 h-5",
              isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
            )} />
          )}
        </div>
      </div>

      {isOpen && <div>
          {actions.length === 0 ? <div className={cn(
            "text-center py-8",
            isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
          )}>
              <p>No actions logged yet.</p>
            </div> : <>
              {myActions.length > 0 && renderActionsTable(myActions, "My Actions")}
              {officeTeamActions.length > 0 && renderActionsTable(officeTeamActions, "Office Team Actions")}
              {renderActionsTable(closedActions, "Closed Actions (Last 30 Days)")}
              
              {openActions.length === 0 && closedActions.length === 0 && <div className={cn(
                "text-center py-8",
                isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
              )}>
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
