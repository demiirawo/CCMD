import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';

interface FieldConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  field: {
    id: string;
    name: string;
    field_type: string;
    field_config: any;
  } | null;
}

export const FieldConfigDialog = ({ isOpen, onClose, onSave, field }: FieldConfigDialogProps) => {
  const [config, setConfig] = useState(field?.field_config || {});

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const addOption = () => {
    const newOptions = [...(config.options || [])];
    const newId = Math.max(0, ...newOptions.map((opt: any) => parseInt(opt.id) || 0)) + 1;
    newOptions.push({
      id: newId.toString(),
      name: `Option ${newId}`,
      color: '#3b82f6'
    });
    setConfig({ ...config, options: newOptions });
  };

  const updateOption = (index: number, updates: any) => {
    const newOptions = [...(config.options || [])];
    newOptions[index] = { ...newOptions[index], ...updates };
    setConfig({ ...config, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = config.options.filter((_: any, i: number) => i !== index);
    setConfig({ ...config, options: newOptions });
  };

  if (!field) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {field.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Single Select / Multi Select Options */}
          {(field.field_type === 'single_select' || field.field_type === 'multi_select') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Options</Label>
                <Button size="sm" onClick={addOption} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(config.options || []).map((option: any, index: number) => (
                  <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
                    <input
                      type="color"
                      value={option.color}
                      onChange={(e) => updateOption(index, { color: e.target.value })}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={option.name}
                      onChange={(e) => updateOption(index, { name: e.target.value })}
                      placeholder="Option name"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(index)}
                      className="p-1 h-auto text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {(!config.options || config.options.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No options yet. Click "Add Option" to create the first one.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Rating Max Value */}
          {field.field_type === 'rating' && (
            <div>
              <Label htmlFor="rating-max">Maximum Rating</Label>
              <Input
                id="rating-max"
                type="number"
                min="1"
                max="10"
                value={config.max || 5}
                onChange={(e) => setConfig({ ...config, max: parseInt(e.target.value) || 5 })}
              />
            </div>
          )}

          {/* Currency/Number Format */}
          {(field.field_type === 'currency' || field.field_type === 'number' || field.field_type === 'percent') && (
            <div>
              <Label htmlFor="precision">Decimal Places</Label>
              <Input
                id="precision"
                type="number"
                min="0"
                max="10"
                value={config.precision || 2}
                onChange={(e) => setConfig({ ...config, precision: parseInt(e.target.value) || 2 })}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};