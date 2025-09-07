import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

interface ViewCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  onViewCreated: (view: BaseView) => void;
  availableFolders: string[];
}

export const ViewCreateDialog: React.FC<ViewCreateDialogProps> = ({
  isOpen,
  onClose,
  tableId,
  onViewCreated,
  availableFolders
}) => {
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');
  const [viewType, setViewType] = useState('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('base_views')
        .insert({
          name: name.trim(),
          table_id: tableId,
          view_type: viewType,
          filters: [],
          sorts: [],
          groups: [],
          visible_fields: [],
          settings: { folder },
          is_default: false,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      const newView: BaseView = {
        id: data.id,
        name: data.name,
        filters: data.filters,
        sorts: data.sorts,
        groups: data.groups,
        visible_fields: data.visible_fields,
        settings: data.settings,
        view_type: data.view_type,
        is_default: data.is_default,
        folder: (data.settings as any)?.folder
      };

      onViewCreated(newView);
    setName('');
    setFolder('');
    setViewType('grid');
      
      toast({
        title: "Success",
        description: "View created successfully",
      });
    } catch (error) {
      console.error('Error creating view:', error);
      toast({
        title: "Error",
        description: "Failed to create view",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setFolder('');
    setViewType('grid');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New View</DialogTitle>
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
            <Label htmlFor="folder">Folder (Optional)</Label>
            <Select value={folder} onValueChange={setFolder}>
              <SelectTrigger>
                <SelectValue placeholder="Select or create folder" />
              </SelectTrigger>
              <SelectContent>
                {availableFolders.map((folderName) => (
                  <SelectItem key={folderName} value={folderName}>
                    {folderName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Or enter new folder name..."
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="mt-1"
            />
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create View'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};