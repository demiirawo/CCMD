import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BaseView {
  id: string;
  name: string;
  filters: any;
  sorts: any;
  groups: any;
  visible_fields: any;
  settings: any;
  view_type: string;
  is_default: boolean;
  folder?: string;
}

interface ViewEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  view: BaseView;
  onViewUpdated: (view: BaseView) => void;
  availableFolders: string[];
}

export const ViewEditDialog: React.FC<ViewEditDialogProps> = ({
  isOpen,
  onClose,
  view,
  onViewUpdated,
  availableFolders
}) => {
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('General');
  const [viewType, setViewType] = useState('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (view) {
      setName(view.name);
      setFolder((view.settings as any)?.folder || 'General');
      setViewType(view.view_type);
    }
  }, [view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('base_views')
        .update({
          name: name.trim(),
          view_type: viewType,
          settings: { ...(view.settings as any), folder }
        })
        .eq('id', view.id)
        .select()
        .single();

      if (error) throw error;

      const updatedView: BaseView = {
        ...view,
        name: data.name,
        view_type: data.view_type,
        settings: data.settings,
        folder: (data.settings as any)?.folder
      };

      onViewUpdated(updatedView);
      
      toast({
        title: "Success",
        description: "View updated successfully",
      });
    } catch (error) {
      console.error('Error updating view:', error);
      toast({
        title: "Error",
        description: "Failed to update view",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit View</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">View Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter view name..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFolders.map((folderName) => (
                  <SelectItem key={folderName} value={folderName}>
                    {folderName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="viewType">View Type</Label>
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Updating...' : 'Update View'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};