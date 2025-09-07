import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUp, ArrowDown, Plus, X } from 'lucide-react';

interface BaseField {
  id: string;
  name: string;
  field_type: string;
  field_config: any;
  is_required: boolean;
  position: number;
}

export interface SortCondition {
  fieldId: string;
  direction: 'asc' | 'desc';
}

interface TableSortDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fields: BaseField[];
  currentSorts: SortCondition[];
  onApplySorts: (sorts: SortCondition[]) => void;
  groupByField?: string | null;
}

export const TableSortDialog: React.FC<TableSortDialogProps> = ({
  isOpen,
  onClose,
  fields,
  currentSorts,
  onApplySorts,
  groupByField
}) => {
  const [localSorts, setLocalSorts] = useState<SortCondition[]>(currentSorts.length > 0 ? currentSorts : []);

  const addSort = () => {
    setLocalSorts(prev => [...prev, { fieldId: '', direction: 'asc' }]);
  };

  const removeSort = (index: number) => {
    setLocalSorts(prev => prev.filter((_, i) => i !== index));
  };

  const updateSort = (index: number, updates: Partial<SortCondition>) => {
    setLocalSorts(prev => prev.map((sort, i) => 
      i === index ? { ...sort, ...updates } : sort
    ));
  };

  const handleApply = () => {
    const validSorts = localSorts.filter(sort => sort.fieldId);
    onApplySorts(validSorts);
    onClose();
  };

  const handleClear = () => {
    setLocalSorts([]);
    onApplySorts([]);
    onClose();
  };

  const availableFields = fields.filter(field => 
    !localSorts.some(sort => sort.fieldId === field.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {groupByField ? 'Sort within groups' : 'Sort by'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Sort conditions */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              {groupByField 
                ? `Sort within groups by`
                : 'Sort by'
              }
            </div>
            
            {localSorts.map((sort, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <Select
                  value={sort.fieldId}
                  onValueChange={(fieldId) => updateSort(index, { fieldId })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.concat(
                      sort.fieldId ? [fields.find(f => f.id === sort.fieldId)!] : []
                    ).filter(Boolean).map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={sort.direction}
                  onValueChange={(direction: 'asc' | 'desc') => updateSort(index, { direction })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-3 w-3" />
                        A → Z
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-3 w-3" />
                        Z → A
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSort(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {availableFields.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addSort}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add another sort
              </Button>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClear}>
              Clear sorting
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};