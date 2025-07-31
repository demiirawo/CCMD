import { useState } from "react";
import { Plus, Minus, Calendar, Check, Edit } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format, differenceInDays } from "date-fns";
import { ActionEditDialog } from "./ActionEditDialog";
import { AuditEntry } from "./ActionsLog";
export interface ActionItem {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  auditTrail?: AuditEntry[]; // Add audit trail to ActionItem
}
interface ActionFormProps {
  actions: ActionItem[];
  attendees: string[];
  sectionStatus?: string; // Add section status for RAG coloring
  onActionsChange: (actions: ActionItem[]) => void;
  onActionCreated?: (name: string, description: string, targetDate: string, actionId: string) => void;
  onActionCompleted?: (actionId: string) => void;
  onActionEdit?: (actionId: string, updates: { comment?: string; dueDate?: string; owner?: string }) => void;
}
export const ActionForm = ({
  actions,
  attendees,
  sectionStatus,
  onActionsChange,
  onActionCreated,
  onActionCompleted,
  onActionEdit
}: ActionFormProps) => {
  const [newAction, setNewAction] = useState({
    name: "",
    description: "",
    targetDate: ""
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);
  const addAction = () => {
    if (newAction.name && newAction.description && newAction.targetDate) {
      const actionItem: ActionItem = {
        id: `action-${Date.now()}`,
        name: newAction.name,
        description: newAction.description,
        targetDate: newAction.targetDate
      };
      const updatedActions = [...actions, actionItem];
      onActionsChange(updatedActions);

      // Notify parent for actions log
      onActionCreated?.(newAction.name, newAction.description, newAction.targetDate, actionItem.id);

      // Reset form
      setNewAction({
        name: "",
        description: "",
        targetDate: ""
      });
    }
  };
  const removeAction = (actionId: string) => {
    const updatedActions = actions.filter(action => action.id !== actionId);
    onActionsChange(updatedActions);
  };
  const handleDateSelect = (date: Date | undefined) => {
    console.log("Date selected:", date);
    if (date) {
      const formattedDate = format(date, "dd/MM/yyyy");
      console.log("Formatted date:", formattedDate);
      const updatedAction = {
        ...newAction,
        targetDate: formattedDate
      };
      setNewAction(updatedAction);
      setIsDatePickerOpen(false); // Close the popover

      // Auto-save the action if all fields are filled
      if (updatedAction.name && updatedAction.description && formattedDate) {
        const actionItem: ActionItem = {
          id: `action-${Date.now()}`,
          name: updatedAction.name,
          description: updatedAction.description,
          targetDate: formattedDate
        };
        const updatedActions = [...actions, actionItem];
        onActionsChange(updatedActions);

        // Notify parent for actions log
        onActionCreated?.(updatedAction.name, updatedAction.description, formattedDate, actionItem.id);

        // Reset form
        setNewAction({
          name: "",
          description: "",
          targetDate: ""
        });
      }
    }
  };
  const getDaysRemaining = (targetDate: string) => {
    try {
      let dueDate: Date;
      
      // Handle both DD/MM/YYYY and YYYY-MM-DD formats
      if (targetDate.includes('/')) {
        // DD/MM/YYYY format
        const [day, month, year] = targetDate.split('/');
        dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (targetDate.includes('-')) {
        // YYYY-MM-DD format
        dueDate = new Date(targetDate);
      } else {
        return 0;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return differenceInDays(dueDate, today);
    } catch {
      return 0;
    }
  };
  const getActionColorClass = (targetDate: string) => {
    const daysRemaining = getDaysRemaining(targetDate);
    if (daysRemaining < 0) {
      return "bg-red-800 border-red-700 text-white";
    } else if (daysRemaining <= 5) {
      return "bg-amber-800 border-amber-700 text-white";
    } else {
      return "bg-green-800 border-green-700 text-white";
    }
  };
  const formatDaysRemaining = (targetDate: string) => {
    const daysRemaining = getDaysRemaining(targetDate);
    if (daysRemaining < 0) {
      return `${Math.abs(daysRemaining)} day(s) overdue`;
    } else if (daysRemaining === 0) {
      return "Due today";
    } else {
      return `${daysRemaining} day(s) remaining`;
    }
  };

  // Sort actions by due date (soonest first)
  const sortActionsByDate = (actionsToSort: ActionItem[]) => {
    return [...actionsToSort].sort((a, b) => {
      const getDays = (targetDate: string) => {
        try {
          let dueDate: Date;
          
          // Handle both DD/MM/YYYY and YYYY-MM-DD formats
          if (targetDate.includes('/')) {
            // DD/MM/YYYY format
            const [day, month, year] = targetDate.split('/');
            dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else if (targetDate.includes('-')) {
            // YYYY-MM-DD format
            dueDate = new Date(targetDate);
          } else {
            return 0;
          }
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          return differenceInDays(dueDate, today);
        } catch {
          return 0;
        }
      };
      
      const daysA = getDays(a.targetDate);
      const daysB = getDays(b.targetDate);
      
      return daysA - daysB; // Soonest (lowest number of days) first
    });
  };

  // Get RAG background colors to match the section
  const getRAGBackgroundClass = () => {
    switch (sectionStatus) {
      case 'green':
        return 'bg-green-50/80';
      case 'amber':
        return 'bg-amber-50/80';
      case 'red':
        return 'bg-red-50/80';
      case 'na':
        return 'bg-gray-50/80';
      default:
        return 'bg-white';
    }
  };

  const handleActionEdit = (actionId: string, updates: { comment?: string; dueDate?: string; owner?: string }) => {
    const updatedActions = actions.map(action => {
      if (action.id !== actionId) return action;
      
      const updatedAction = { ...action };
      const auditEntries: AuditEntry[] = action.auditTrail || [];
      const timestamp = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Add comment to audit trail
      if (updates.comment) {
        auditEntries.push({
          timestamp,
          change: `Comment added: ${updates.comment}`
        });
      }

      // Update due date and add to audit trail
      if (updates.dueDate && updates.dueDate !== action.targetDate) {
        auditEntries.push({
          timestamp,
          change: `Due date changed from ${action.targetDate} to ${updates.dueDate}`
        });
        updatedAction.targetDate = updates.dueDate;
      }

      // Update owner and add to audit trail
      if (updates.owner && updates.owner !== action.name) {
        auditEntries.push({
          timestamp,
          change: `Action owner changed to ${updates.owner}`
        });
        updatedAction.name = updates.owner;
      }

      updatedAction.auditTrail = auditEntries;
      return updatedAction;
    });

    onActionsChange(updatedActions);
    onActionEdit?.(actionId, updates);
  };
  return <div className="space-y-4">
      {/* Existing Actions */}
      {actions.length > 0 && <div className="space-y-2">
          {sortActionsByDate(actions).map(action => (
            <div key={action.id} className={`flex items-start gap-2 p-3 rounded-lg border ${getActionColorClass(action.targetDate)}`}>
              <div className="flex-1 min-w-0">
                <div className="font-medium break-words">
                  <span className="font-bold">{action.name}</span> - {action.description}
                </div>
                <div className="text-sm opacity-80 mt-1">
                  Due: {action.targetDate} • {formatDaysRemaining(action.targetDate)}
                </div>
                {/* Show full audit trail */}
                {action.auditTrail && action.auditTrail.length > 0 && (
                  <div className="text-xs mt-2 space-y-1">
                     {action.auditTrail.map((entry, entryIndex) => (
                       <div key={`${action.id}-audit-${entryIndex}`} className="text-blue-200 bg-blue-900/50 p-1 rounded border-l-2 border-blue-400">
                         <span className="font-medium">{entry.timestamp}:</span> {entry.change}
                       </div>
                     ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {onActionEdit && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingAction(action)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 font-bold" 
                    title="Edit action"
                  >
                    <Edit className="h-4 w-4 font-bold stroke-2" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onActionCompleted?.(action.id)} 
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 font-bold" 
                  title="Mark as completed"
                >
                  <Check className="h-4 w-4 font-bold stroke-2" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeAction(action.id)} 
                  className="h-8 w-8 p-0 text-white hover:bg-white/20 font-bold" 
                  title="Delete action"
                >
                  <Minus className="h-4 w-4 font-bold stroke-2" />
                </Button>
              </div>
            </div>
          ))}
        </div>}

      {/* Action Edit Dialog */}
      <ActionEditDialog 
        isOpen={!!editingAction}
        onClose={() => setEditingAction(null)}
        action={editingAction ? {
          ...editingAction,
          itemTitle: "Section Action",
          mentionedAttendee: editingAction.name,
          comment: editingAction.description,
          action: editingAction.description,
          dueDate: editingAction.targetDate,
          timestamp: new Date().toISOString(),
          id: editingAction.id
        } : null}
        onSave={(actionId, updates) => {
          handleActionEdit(actionId, updates);
          setEditingAction(null);
        }}
        attendees={attendees}
      />

      {/* Add New Action Form */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex gap-3 items-start">
          {/* Name Dropdown */}
          <div className="w-48">
            <label className="text-xs text-muted-foreground mb-1 block px-2 py-1 rounded uppercase">ASSIGNED TO</label>
            <Select value={newAction.name} onValueChange={value => setNewAction(prev => ({
            ...prev,
            name: value
          }))}>
              <SelectTrigger className={`h-9 ${getRAGBackgroundClass()}`}>
                <SelectValue placeholder="Select person..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {attendees.map((attendee, index) => <SelectItem key={`${attendee}-${index}`} value={attendee}>
                    {attendee}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Action Description - Wider to utilize space */}
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block px-2 py-1 rounded uppercase">ACTION DESCRIPTION</label>
            <textarea placeholder="Enter action description..." value={newAction.description} onChange={e => setNewAction(prev => ({
            ...prev,
            description: e.target.value
          }))} rows={1} style={{
            height: 'auto',
            minHeight: '36px'
          }} onInput={e => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }} className="min-h-[36px] w-full px-3 py-2 text-sm border border-input rounded-md resize-none overflow-hidden bg-white" />
          </div>

          {/* Target Date - Just calendar emoji */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block px-2 py-1 rounded uppercase">DATE</label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`h-9 w-9 p-0 bg-white ${newAction.targetDate ? 'bg-green-50 border-green-300' : ''}`} title={newAction.targetDate || "Select date"}>
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border shadow-lg" align="start">
                <div className="bg-white rounded-lg">
                  <CalendarComponent mode="single" onSelect={handleDateSelect} initialFocus className="p-3 pointer-events-auto bg-white rounded-lg" disabled={date => date < new Date()} />
                </div>
              </PopoverContent>
            </Popover>
            {newAction.targetDate && <div className="text-xs text-muted-foreground mt-1 text-center">
                {newAction.targetDate}
              </div>}
          </div>
        </div>
      </div>
    </div>;
};