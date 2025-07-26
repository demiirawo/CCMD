import { useState } from "react";
import { Plus, Minus, Calendar, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format, differenceInDays } from "date-fns";

export interface ActionItem {
  id: string;
  name: string;
  description: string;
  targetDate: string;
}

interface ActionFormProps {
  actions: ActionItem[];
  attendees: string[];
  onActionsChange: (actions: ActionItem[]) => void;
  onActionCreated?: (name: string, description: string, targetDate: string) => void;
  onActionCompleted?: (actionId: string) => void;
}

export const ActionForm = ({ 
  actions, 
  attendees, 
  onActionsChange, 
  onActionCreated,
  onActionCompleted 
}: ActionFormProps) => {
  const [newAction, setNewAction] = useState({
    name: "",
    description: "",
    targetDate: ""
  });

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
      onActionCreated?.(newAction.name, newAction.description, newAction.targetDate);
      
      // Reset form
      setNewAction({ name: "", description: "", targetDate: "" });
    }
  };

  const removeAction = (actionId: string) => {
    const updatedActions = actions.filter(action => action.id !== actionId);
    onActionsChange(updatedActions);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setNewAction(prev => ({
        ...prev,
        targetDate: format(date, "dd/MM/yyyy")
      }));
    }
  };

  const getDaysRemaining = (targetDate: string) => {
    try {
      const [day, month, year] = targetDate.split('/');
      const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
      return "bg-red-50 border-red-200 text-red-900";
    } else if (daysRemaining <= 5) {
      return "bg-amber-50 border-amber-200 text-amber-900";
    } else {
      return "bg-green-50 border-green-200 text-green-900";
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

  return (
    <div className="space-y-4">
      {/* Existing Actions */}
      {actions.length > 0 && (
        <div className="space-y-2">
          {actions.map((action) => (
            <div key={action.id} className={`flex items-center gap-2 p-3 rounded-lg border ${getActionColorClass(action.targetDate)}`}>
              <div className="flex-1">
                <div className="font-medium">
                  <span className="font-bold">{action.name}</span> - {action.description}
                </div>
                <div className="text-sm opacity-80">
                  Due: {action.targetDate} • {formatDaysRemaining(action.targetDate)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onActionCompleted?.(action.id)}
                  className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
                  title="Mark as completed"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAction(action.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-100"
                  title="Delete action"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Action Form */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="text-sm font-medium text-muted-foreground">Add New Action</div>
        
        <div className="flex gap-3 items-end">
          {/* Name Dropdown */}
          <div className="w-48">
            <label className="text-xs text-muted-foreground mb-1 block">Assigned To</label>
            <Select 
              value={newAction.name} 
              onValueChange={(value) => setNewAction(prev => ({ ...prev, name: value }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select person..." />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {attendees.map((attendee) => (
                  <SelectItem key={attendee} value={attendee}>
                    {attendee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Description - Wider to utilize space */}
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Action Description</label>
            <Input
              placeholder="Enter action description..."
              value={newAction.description}
              onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
              className="h-9"
            />
          </div>

          {/* Target Date - Just calendar emoji */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0"
                  title={newAction.targetDate || "Select date"}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border shadow-lg" align="start">
                <div className="bg-white rounded-lg">
                  <CalendarComponent
                    mode="single"
                    onSelect={handleDateSelect}
                    initialFocus
                    className="p-3 pointer-events-auto bg-white rounded-lg"
                    disabled={(date) => date < new Date()}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Add Button */}
          <div>
            <Button
              onClick={addAction}
              disabled={!newAction.name || !newAction.description || !newAction.targetDate}
              size="sm"
              className="h-9 w-9 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
