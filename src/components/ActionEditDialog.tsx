import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ActionLogEntry } from "./ActionsLog";
interface ActionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: ActionLogEntry | null;
  onSave: (actionId: string, updates: {
    comment?: string;
    dueDate?: string;
    owner?: string;
    action?: string;
  }) => void;
  attendees?: string[];
}
export const ActionEditDialog = ({
  isOpen,
  onClose,
  action,
  onSave,
  attendees = []
}: ActionEditDialogProps) => {
  const [newComment, setNewComment] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newActionText, setNewActionText] = useState("");

  // Helpers to normalize date formats
  const toISO = (dateStr: string): string => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr; // already ISO
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  };
  const toDDMMYYYY = (iso: string): string => {
    if (!iso) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso; // already formatted
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, yyyy, mm, dd] = m;
      return `${dd}/${mm}/${yyyy}`;
    }
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy}`;
    }
    return iso;
  };

  // Reset form when action changes or dialog opens
  useEffect(() => {
    if (action && isOpen) {
      setNewDueDate(toISO(action.dueDate || ""));
      setNewOwner(action.mentionedAttendee || "");
      setNewComment("");
      setNewActionText(action.action || "");
    }
  }, [action, isOpen]);
  const handleSave = () => {
    if (!action) return;
    const updates: {
      comment?: string;
      dueDate?: string;
      owner?: string;
      action?: string;
    } = {};
    if (newComment.trim()) {
      updates.comment = newComment.trim();
    }
    if (newActionText && newActionText.trim() !== action.action) {
      updates.action = newActionText.trim();
    }

    // Only update due date if it's actually different and not empty
    if (newDueDate) {
      const formatted = toDDMMYYYY(newDueDate);
      if (formatted && formatted !== action.dueDate) {
        updates.dueDate = formatted;
      }
    }

    // Only update owner if it's actually different and not empty
    if (newOwner && newOwner !== action.mentionedAttendee) {
      updates.owner = newOwner;
    }
    if (Object.keys(updates).length > 0) {
      onSave(action.id, updates);
      setNewComment("");
      setNewDueDate(toISO(action.dueDate || ""));
      setNewOwner(action.mentionedAttendee || "");
      setNewActionText(action.action || "");
      onClose();
    }
  };
  const handleClose = () => {
    setNewComment("");
    setNewDueDate(toISO(action?.dueDate || ""));
    setNewOwner(action?.mentionedAttendee || "");
    setNewActionText(action?.action || "");
    onClose();
  };
  if (!action) return null;
  return <Dialog open={isOpen} onOpenChange={handleClose}>
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
          {action.auditTrail && action.auditTrail.length > 0 && <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-blue-800 mb-2">Audit Trail:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {action.auditTrail.map((entry, index) => <div key={index} className="text-xs bg-white p-2 rounded border-l-2 border-blue-200">
                    <div className="font-medium text-blue-700">{entry.timestamp}</div>
                    <div className="text-gray-700">{entry.change}</div>
                  </div>)}
              </div>
            </div>}

          {/* Edit Action Text */}
          <div className="space-y-2">
            <Label htmlFor="actionText">Action Text</Label>
            <Textarea id="actionText" value={newActionText} onChange={e => setNewActionText(e.target.value)} placeholder="Edit the original action text..." className="min-h-[80px] bg-white text-black" />
            {newActionText.trim() !== action.action}
          </div>

          {/* Add Audit Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Add Audit Comment</Label>
            <Textarea id="comment" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment to update this action..." className="min-h-[80px] bg-white text-black" />
          </div>
          {/* Change Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="w-full bg-white text-black" />
            {toDDMMYYYY(newDueDate) !== action.dueDate && <p className="text-xs text-amber-600">
                Due date will be changed from {action.dueDate} to {toDDMMYYYY(newDueDate)}
              </p>}
          </div>

          {/* Change Action Owner */}
          <div className="space-y-2">
            <Label htmlFor="owner">Action Owner</Label>
            <Select value={newOwner} onValueChange={setNewOwner}>
              <SelectTrigger className="bg-white text-black">
                <SelectValue placeholder="Select action owner" />
              </SelectTrigger>
              <SelectContent>
                {attendees.map(attendee => <SelectItem key={attendee} value={attendee}>
                    {attendee}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            {newOwner !== action.mentionedAttendee && <p className="text-xs text-amber-600">
                Action owner will be changed from {action.mentionedAttendee} to {newOwner}
              </p>}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={!newComment.trim() && toDDMMYYYY(newDueDate) === action.dueDate && newOwner === action.mentionedAttendee} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};