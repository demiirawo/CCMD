import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BaseField {
  id: string;
  name: string;
  field_type: string;
  field_config: any;
  is_required: boolean;
  position: number;
}

interface GroupByDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fields: BaseField[];
  currentGroupBy: string | null;
  onApplyGroupBy: (fieldId: string | null) => void;
}

export const GroupByDialog: React.FC<GroupByDialogProps> = ({
  isOpen,
  onClose,
  fields,
  currentGroupBy,
  onApplyGroupBy
}) => {
  const [selectedField, setSelectedField] = useState<string | null>(currentGroupBy);
  const [showAllFields, setShowAllFields] = useState(false);

  // Common grouping fields (shown by default)
  const commonFields = fields.filter(field => 
    ['single_select', 'multi_select', 'checkbox', 'date', 'datetime'].includes(field.field_type)
  ).slice(0, 5);

  const otherFields = fields.filter(field => 
    !commonFields.find(cf => cf.id === field.id)
  );

  const handleApply = () => {
    onApplyGroupBy(selectedField);
    onClose();
  };

  const handleClear = () => {
    setSelectedField(null);
    onApplyGroupBy(null);
    onClose();
  };

  const renderFieldOption = (field: BaseField) => (
    <div
      key={field.id}
      className={`flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-md ${
        selectedField === field.id ? 'bg-muted' : ''
      }`}
      onClick={() => setSelectedField(field.id)}
    >
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 flex items-center justify-center">
          {getFieldIcon(field.field_type)}
        </div>
        <span className="font-medium">{field.name}</span>
      </div>
      {selectedField === field.id && (
        <Check className="w-4 h-4 text-primary" />
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Group by</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Copy from view option - placeholder for future */}
          <div className="text-sm text-muted-foreground border-b pb-3">
            Copy from a view
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Pick a field to group by
            </h4>
            
            <div className="space-y-1">
              {commonFields.map(renderFieldOption)}
              
              {otherFields.length > 0 && (
                <Collapsible open={showAllFields} onOpenChange={setShowAllFields}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-muted/50 rounded-md text-sm">
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAllFields ? 'rotate-180' : ''}`} />
                    See all fields
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {otherFields.map(renderFieldOption)}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClear}>
              Clear grouping
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={!selectedField}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getFieldIcon = (fieldType: string) => {
  switch (fieldType) {
    case 'single_select':
    case 'multi_select':
      return <div className="w-3 h-3 rounded-full bg-blue-500" />;
    case 'checkbox':
      return <div className="w-3 h-3 border-2 border-gray-400" />;
    case 'date':
    case 'datetime':
      return <div className="w-3 h-3 bg-green-500 rounded" />;
    case 'number':
    case 'currency':
      return <div className="w-3 h-3 bg-purple-500 rounded" />;
    default:
      return <div className="w-3 h-3 bg-gray-400 rounded" />;
  }
};