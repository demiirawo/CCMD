import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: string, dueDate: string) => void;
  mentionedAttendee: string;
  itemTitle: string;
}

export const ActionDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mentionedAttendee, 
  itemTitle 
}: ActionDialogProps) => {
  const [action, setAction] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = () => {
    if (action.trim() && dueDate) {
      onSubmit(action.trim(), dueDate);
      setAction("");
      setDueDate("");
      onClose();
    }
  };

  const handleClose = () => {
    setAction("");
    setDueDate("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Action for @{mentionedAttendee}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="text-sm text-muted-foreground">
            Item: <span className="font-medium">{itemTitle}</span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="action">Action Required</Label>
            <Textarea
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Describe what needs to be done..."
              className="min-h-[80px]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!action.trim() || !dueDate}>
            Create Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};