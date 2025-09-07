import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseField {
  id: string;
  name: string;
  field_type: string;
  field_config: any;
  is_required: boolean;
  position: number;
}

export interface ColorCondition {
  id: string;
  fieldId: string;
  operator: string;
  value: string;
  color: string;
}

interface RowColorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fields: BaseField[];
  currentColors: ColorCondition[];
  onApplyColors: (colors: ColorCondition[]) => void;
}

const PASTEL_COLORS = [
  { name: 'Pastel Pink', value: '#FFD1DC', bgClass: 'bg-[#FFD1DC]' },
  { name: 'Pastel Blue', value: '#AEC6CF', bgClass: 'bg-[#AEC6CF]' },
  { name: 'Pastel Green', value: '#77DD77', bgClass: 'bg-[#77DD77]' },
  { name: 'Pastel Yellow', value: '#FDFD96', bgClass: 'bg-[#FDFD96]' },
  { name: 'Pastel Orange', value: '#FFB347', bgClass: 'bg-[#FFB347]' },
  { name: 'Pastel Purple', value: '#DDA0DD', bgClass: 'bg-[#DDA0DD]' },
  { name: 'Pastel Mint', value: '#98FB98', bgClass: 'bg-[#98FB98]' },
  { name: 'Pastel Peach', value: '#FFCBA4', bgClass: 'bg-[#FFCBA4]' },
];

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
];

export const RowColorDialog: React.FC<RowColorDialogProps> = ({
  isOpen,
  onClose,
  fields,
  currentColors,
  onApplyColors
}) => {
  const [localColors, setLocalColors] = useState<ColorCondition[]>(currentColors.length > 0 ? currentColors : []);

  const addColorCondition = () => {
    setLocalColors(prev => [...prev, {
      id: `color_${Date.now()}`,
      fieldId: '',
      operator: 'equals',
      value: '',
      color: PASTEL_COLORS[0].value
    }]);
  };

  const removeColorCondition = (id: string) => {
    setLocalColors(prev => prev.filter(color => color.id !== id));
  };

  const updateColorCondition = (id: string, updates: Partial<ColorCondition>) => {
    setLocalColors(prev => prev.map(color => 
      color.id === id ? { ...color, ...updates } : color
    ));
  };

  const handleApply = () => {
    const validColors = localColors.filter(color => color.fieldId && (color.operator === 'is_empty' || color.operator === 'is_not_empty' || color.value));
    onApplyColors(validColors);
    onClose();
  };

  const handleClear = () => {
    setLocalColors([]);
    onApplyColors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color rows by condition
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Rows are colored based on the first matching condition
          </div>
          
          {/* Color conditions */}
          <div className="space-y-3">
            {localColors.map((colorCondition, index) => (
              <div key={colorCondition.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {/* Field selector */}
                <Select
                  value={colorCondition.fieldId}
                  onValueChange={(fieldId) => updateColorCondition(colorCondition.id, { fieldId })}
                >
                  <SelectTrigger className="flex-1 bg-white">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {fields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Operator selector */}
                <Select
                  value={colorCondition.operator}
                  onValueChange={(operator) => updateColorCondition(colorCondition.id, { operator })}
                >
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {OPERATORS.map((operator) => (
                      <SelectItem key={operator.value} value={operator.value}>
                        {operator.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Value input (hide for empty/not empty operators) */}
                {!['is_empty', 'is_not_empty'].includes(colorCondition.operator) && (
                  <Input
                    placeholder="Enter value"
                    value={colorCondition.value}
                    onChange={(e) => updateColorCondition(colorCondition.id, { value: e.target.value })}
                    className="flex-1 bg-white"
                  />
                )}
                
                {/* Color selector */}
                <Select
                  value={colorCondition.color}
                  onValueChange={(color) => updateColorCondition(colorCondition.id, { color })}
                >
                  <SelectTrigger className="w-32 bg-white">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-sm border"
                        style={{ backgroundColor: colorCondition.color }}
                      />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {PASTEL_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-sm border"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeColorCondition(colorCondition.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addColorCondition}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Add color condition
            </Button>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClear}>
              Clear colors
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