import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { StatusItemData } from "./StatusItem";
import { ActionItem } from "./ActionForm";

interface ActionsLogProps {
  sections: Array<{
    title: string;
    items: StatusItemData[];
  }>;
  sessionId?: string;
  onPanelStateChange?: () => void;
  panelStateTracker?: number;
}

interface ActionSummary {
  id: string;
  action: string;
  owner: string;
  dueDate: string;
  sourceItem: string;
  sourceSection: string;
}

export const ActionsLog = ({
  sections,
  sessionId,
  onPanelStateChange,
  panelStateTracker
}: ActionsLogProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
    const isolatedStorageKey = `actions_log_expanded_${tabId}`;
    const saved = sessionStorage.getItem(isolatedStorageKey);
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Listen for panel state changes to sync with sessionStorage
  useEffect(() => {
    const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
    const isolatedStorageKey = `actions_log_expanded_${tabId}`;
    const saved = sessionStorage.getItem(isolatedStorageKey);
    const savedState = saved !== null ? JSON.parse(saved) : false;
    if (savedState !== isExpanded) {
      setIsExpanded(savedState);
    }
  }, [panelStateTracker, isExpanded]);

  // Extract all actions from subsections
  const allActions = useMemo(() => {
    const actions: ActionSummary[] = [];
    
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.actions && item.actions.length > 0) {
          item.actions.forEach(action => {
            actions.push({
              id: action.id,
              action: action.description,
              owner: action.name,
              dueDate: action.targetDate,
              sourceItem: item.title,
              sourceSection: section.title
            });
          });
        }
      });
    });

    return actions;
  }, [sections]);

  // Calculate days remaining and get status
  const getDaysRemaining = (dueDate: string): number => {
    if (!dueDate || dueDate.trim() === '') return 0;
    
    const due = new Date(dueDate);
    const today = new Date();
    
    if (isNaN(due.getTime())) {
      return 0;
    }
    
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return isNaN(diffDays) ? 0 : diffDays;
  };

  // Sort actions by due date (soonest first)
  const sortedActions = useMemo(() => {
    return [...allActions].sort((a, b) => {
      const aDue = new Date(a.dueDate);
      const bDue = new Date(b.dueDate);
      return aDue.getTime() - bDue.getTime();
    });
  }, [allActions]);

  // Calculate overall status
  const getOverallStatus = (): 'green' | 'red' => {
    const hasOverdue = allActions.some(action => {
      const daysRemaining = getDaysRemaining(action.dueDate);
      return daysRemaining < 0;
    });
    
    return hasOverdue ? 'red' : 'green';
  };

  const overallStatus = getOverallStatus();

  // Get background class with dynamic panel colour support
  const getBackgroundClass = () => {
    switch (overallStatus) {
      case 'green':
        return 'bg-status-green text-white';
      case 'red':
        return 'bg-status-red text-white';
      default:
        return 'bg-primary/10';
    }
  };

  // Function to copy actions in a nicely formatted way
  const copyActionsToClipboard = async () => {
    const formatAction = (action: ActionSummary, index: number): string => {
      const days = getDaysRemaining(action.dueDate);
      let status: string;
      
      if (days < 0) {
        status = `${Math.abs(days)} day(s) overdue`;
      } else if (days === 0) {
        status = 'Due today';
      } else {
        status = `${days} day(s) left`;
      }
      
      return `${index + 1}. ${action.action}
   Owner: ${action.owner}
   Due Date: ${action.dueDate}
   Status: ${status}
   From: ${action.sourceSection} > ${action.sourceItem}`;
    };

    let formattedText = 'ACTIONS SUMMARY\n\n';
    
    if (sortedActions.length > 0) {
      formattedText += `ACTIONS (${sortedActions.length})\n`;
      formattedText += '=' .repeat(20) + '\n';
      sortedActions.forEach((action, index) => {
        formattedText += formatAction(action, index) + '\n\n';
      });
    } else {
      formattedText += 'No actions recorded yet.\n';
    }

    try {
      await navigator.clipboard.writeText(formattedText);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getActionRowClass = (action: ActionSummary): string => {
    const daysRemaining = getDaysRemaining(action.dueDate);
    if (daysRemaining < 0) {
      return 'bg-red-100 border border-red-300 text-red-900'; // Overdue
    } else if (daysRemaining <= 5) {
      return 'bg-amber-100 border border-amber-300 text-amber-900'; // Due within 5 days
    } else {
      return 'bg-green-100 border border-green-300 text-green-900'; // More than 5 days
    }
  };

  return (
    <div className={`rounded-2xl p-6 shadow-lg -mx-8 px-14 outline-none ${getBackgroundClass()}`}>
      <div className="flex items-center justify-between cursor-pointer mb-6 outline-none" onClick={() => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
        const isolatedStorageKey = `actions_log_expanded_${tabId}`;
        sessionStorage.setItem(isolatedStorageKey, JSON.stringify(newState));
        onPanelStateChange?.();
      }}>
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              Actions Summary
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyActionsToClipboard();
                }}
                className="h-6 w-6 p-0 hover:bg-white/20 text-white/80 hover:text-white"
                title="Copy actions summary to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </h3>
            <p className="text-sm text-white/80">
              {(() => {
                const overdueActions = allActions.filter(action => getDaysRemaining(action.dueDate) < 0);
                const activeActions = allActions.filter(action => getDaysRemaining(action.dueDate) >= 0);
                return `${activeActions.length} active, ${overdueActions.length} overdue`;
              })()}
            </p>
          </div>
        </div>
        <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors outline-none">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-white/80" />
          ) : (
            <ChevronRight className="w-5 h-5 text-white/80" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {sortedActions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 px-3 text-sm font-semibold w-16 text-white">ID</th>
                    <th className="text-left py-2 pl-3 text-sm font-semibold w-80 text-white">Description</th>
                    <th className="text-left py-2 pl-3 pr-1 text-sm font-semibold w-32 text-white">Owner</th>
                    <th className="text-left py-2 pl-3 pr-1 text-sm font-semibold w-28 text-white">Due Date</th>
                    <th className="text-left py-2 pl-3 pr-1 text-sm font-semibold w-28 text-white">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedActions.map((action, index) => (
                    <tr key={action.id} className={cn(
                      "border-b border-border/20",
                      getActionRowClass(action)
                    )}>
                      <td className={cn(
                        "py-3 px-3 text-sm",
                        getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                        getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                        "text-green-900"
                      )}>
                        {index + 1}
                      </td>
                      <td className={cn(
                        "py-3 pl-3 text-sm",
                        getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                        getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                        "text-green-900"
                      )}>
                        <div className="w-80 min-h-0">
                          <div className={cn(
                            "text-sm font-medium break-words whitespace-pre-wrap",
                            getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                            getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                            "text-green-900"
                          )}>
                            {action.action}
                          </div>
                          <div className={cn(
                            "text-xs mt-1 break-words",
                            getDaysRemaining(action.dueDate) < 0 ? "text-red-700" :
                            getDaysRemaining(action.dueDate) <= 5 ? "text-amber-700" : 
                            "text-green-700"
                          )}>
                            From: {action.sourceSection} &gt; {action.sourceItem}
                          </div>
                        </div>
                      </td>
                      <td className={cn(
                        "py-3 pl-3 pr-1 text-sm",
                        getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                        getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                        "text-green-900"
                      )}>
                        {action.owner}
                      </td>
                      <td className={cn(
                        "py-3 pl-3 pr-1 text-sm",
                        getDaysRemaining(action.dueDate) < 0 ? "text-red-900" :
                        getDaysRemaining(action.dueDate) <= 5 ? "text-amber-900" : 
                        "text-green-900"
                      )}>
                        {action.dueDate}
                      </td>
                      <td className="py-3 pl-3 pr-1 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          getDaysRemaining(action.dueDate) < 0 ? 'bg-red-100 text-red-700' : 
                          getDaysRemaining(action.dueDate) <= 5 ? 'bg-amber-100 text-amber-700' : 
                          'bg-green-100 text-green-700'
                        }`}>
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
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-white/80">
              No actions recorded yet
            </p>
          )}
        </div>
      )}
    </div>
  );
};