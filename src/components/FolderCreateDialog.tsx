import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPlus } from 'lucide-react';

interface FolderCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: (folderName: string) => void;
  existingFolders: string[];
}

export const FolderCreateDialog: React.FC<FolderCreateDialogProps> = ({
  isOpen,
  onClose,
  onFolderCreated,
  existingFolders
}) => {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = folderName.trim();
    
    if (!trimmedName) {
      setError('Folder name is required');
      return;
    }

    if (existingFolders.includes(trimmedName)) {
      setError('A folder with this name already exists');
      return;
    }

    onFolderCreated(trimmedName);
    setFolderName('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setFolderName('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Create New Folder
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError('');
              }}
              placeholder="Enter folder name..."
              required
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!folderName.trim()}>
              Create Folder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};