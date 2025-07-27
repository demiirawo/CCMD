import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ActionLogEntry } from "./ActionsLog";

interface ActionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: ActionLogEntry | null;
  onSave: (actionId: string, updates: { comment?: string; dueDate?: string }) => void;
}

export const ActionEditDialog = ({
  isOpen,
  onClose,
  action,
  onSave
}: ActionEditDialogProps) => {
  const [newComment, setNewComment] = useState("");
  const [newDueDate, setNewDueDate] = useState(action?.dueDate || "");

  const handleSave = () => {
    if (!action) return;

    const updates: { comment?: string; dueDate?: string } = {};
    
    if (newComment.trim()) {
      updates.comment = newComment.trim();
    }
    
    if (newDueDate !== action.dueDate) {
      updates.dueDate = newDueDate;
    }

    if (Object.keys(updates).length > 0) {
      onSave(action.id, updates);
      setNewComment("");
      setNewDueDate(action.dueDate);
      onClose();
    }
  };

  const handleClose = () => {
    setNewComment("");
    setNewDueDate(action?.dueDate || "");
    onClose();
  };

  if (!action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Action</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Action Details */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Action:</h4>
            <p className="text-sm font-medium">{action.action}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Assigned to: {action.mentionedAttendee} | Due: {action.dueDate}
            </p>
          </div>

          {/* Audit Trail */}
          {action.auditTrail && action.auditTrail.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-blue-800 mb-2">Audit Trail:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {action.auditTrail.map((entry, index) => (
                  <div key={index} className="text-xs bg-white p-2 rounded border-l-2 border-blue-200">
                    <div className="font-medium text-blue-700">{entry.timestamp}</div>
                    <div className="text-gray-700">{entry.change}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Add Comment</Label>
            <Textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment to update this action..."
              className="min-h-[80px]"
            />
          </div>

          {/* Change Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full"
            />
            {newDueDate !== action.dueDate && (
              <p className="text-xs text-amber-600">
                Due date will be changed from {action.dueDate} to {newDueDate}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={!newComment.trim() && newDueDate === action.dueDate}
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};