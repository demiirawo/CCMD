import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Info, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BaseField {
  id: string;
  name: string;
  field_type: string;
  field_config: any;
}

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
}

interface FilterGroup {
  id: string;
  operator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

interface TableFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fields: BaseField[];
  onApplyFilters: (filters: { conditions: FilterCondition[]; groups: FilterGroup[] }) => void;
  initialFilters?: { conditions: FilterCondition[]; groups: FilterGroup[] };
}

// Get available operators for each field type
const getOperatorsForFieldType = (fieldType: string) => {
  const baseOperators = [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ];

  const textOperators = [
    ...baseOperators,
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ];

  const numberOperators = [
    ...baseOperators,
    { value: 'greater_than', label: 'is greater than' },
    { value: 'less_than', label: 'is less than' },
    { value: 'greater_equal', label: 'is greater than or equal to' },
    { value: 'less_equal', label: 'is less than or equal to' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ];

  const dateOperators = [
    ...baseOperators,
    { value: 'before', label: 'is before' },
    { value: 'after', label: 'is after' },
    { value: 'within_days', label: 'is within the last' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ];

  switch (fieldType) {
    case 'single_line':
    case 'long_text':
    case 'email':
    case 'url':
    case 'phone':
      return textOperators;
    case 'number':
    case 'currency':
    case 'percent':
    case 'rating':
      return numberOperators;
    case 'date':
    case 'datetime':
      return dateOperators;
    case 'checkbox':
      return [
        { value: 'is_checked', label: 'is checked' },
        { value: 'is_unchecked', label: 'is unchecked' },
      ];
    case 'single_select':
    case 'multi_select':
      return [
        ...baseOperators,
        { value: 'is_empty', label: 'is empty' },
        { value: 'is_not_empty', label: 'is not empty' },
      ];
    default:
      return baseOperators;
  }
};

// Check if operator needs a value input
const operatorNeedsValue = (operator: string) => {
  return !['is_empty', 'is_not_empty', 'is_checked', 'is_unchecked'].includes(operator);
};

export const TableFilterDialog = ({ 
  isOpen, 
  onClose, 
  fields, 
  onApplyFilters,
  initialFilters 
}: TableFilterDialogProps) => {
  const [conditions, setConditions] = useState<FilterCondition[]>(
    initialFilters?.conditions || []
  );
  const [groups, setGroups] = useState<FilterGroup[]>(
    initialFilters?.groups || []
  );

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: generateId(),
      field: fields[0]?.id || '',
      operator: 'equals',
      value: ''
    };
    setConditions([...conditions, newCondition]);
  };

  const addConditionGroup = () => {
    const newGroup: FilterGroup = {
      id: generateId(),
      operator: 'AND',
      conditions: [
        {
          id: generateId(),
          field: fields[0]?.id || '',
          operator: 'equals',
          value: ''
        }
      ]
    };
    setGroups([...groups, newGroup]);
  };

  const updateCondition = (conditionId: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map(c => 
      c.id === conditionId ? { ...c, ...updates } : c
    ));
  };

  const removeCondition = (conditionId: string) => {
    setConditions(conditions.filter(c => c.id !== conditionId));
  };

  const updateGroupCondition = (groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
    setGroups(groups.map(g => 
      g.id === groupId 
        ? {
            ...g,
            conditions: g.conditions.map(c => 
              c.id === conditionId ? { ...c, ...updates } : c
            )
          }
        : g
    ));
  };

  const addConditionToGroup = (groupId: string) => {
    const newCondition: FilterCondition = {
      id: generateId(),
      field: fields[0]?.id || '',
      operator: 'equals',
      value: ''
    };
    
    setGroups(groups.map(g => 
      g.id === groupId 
        ? { ...g, conditions: [...g.conditions, newCondition] }
        : g
    ));
  };

  const removeConditionFromGroup = (groupId: string, conditionId: string) => {
    setGroups(groups.map(g => 
      g.id === groupId 
        ? { ...g, conditions: g.conditions.filter(c => c.id !== conditionId) }
        : g
    ).filter(g => g.conditions.length > 0)); // Remove empty groups
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const updateGroupOperator = (groupId: string, operator: 'AND' | 'OR') => {
    setGroups(groups.map(g => 
      g.id === groupId ? { ...g, operator } : g
    ));
  };

  const renderValueInput = (condition: FilterCondition) => {
    const field = fields.find(f => f.id === condition.field);
    if (!field || !operatorNeedsValue(condition.operator)) {
      return null;
    }

    switch (field.field_type) {
      case 'checkbox':
        return (
          <Checkbox
            checked={condition.value}
            onCheckedChange={(checked) => 
              updateCondition(condition.id, { value: checked })
            }
          />
        );
      case 'single_select':
        const options = field.field_config?.options || [];
        return (
          <Select
            value={condition.value}
            onValueChange={(value) => updateCondition(condition.id, { value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {options.map((option: any) => (
                <SelectItem key={option.id} value={option.id}>
                  <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: option.color }}></span>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'date':
      case 'datetime':
        return (
          <Input
            type={field.field_type === 'date' ? 'date' : 'datetime-local'}
            value={condition.value}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="h-8"
          />
        );
      case 'number':
      case 'currency':
      case 'percent':
      case 'rating':
        return (
          <Input
            type="number"
            value={condition.value}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            className="h-8"
          />
        );
      default:
        return (
          <Input
            value={condition.value}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
            placeholder="Enter value"
            className="h-8"
          />
        );
    }
  };

  const renderGroupValueInput = (groupId: string, condition: FilterCondition) => {
    const field = fields.find(f => f.id === condition.field);
    if (!field || !operatorNeedsValue(condition.operator)) {
      return null;
    }

    switch (field.field_type) {
      case 'checkbox':
        return (
          <Checkbox
            checked={condition.value}
            onCheckedChange={(checked) => 
              updateGroupCondition(groupId, condition.id, { value: checked })
            }
          />
        );
      case 'single_select':
        const options = field.field_config?.options || [];
        return (
          <Select
            value={condition.value}
            onValueChange={(value) => updateGroupCondition(groupId, condition.id, { value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {options.map((option: any) => (
                <SelectItem key={option.id} value={option.id}>
                  <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: option.color }}></span>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={condition.value}
            onChange={(e) => updateGroupCondition(groupId, condition.id, { value: e.target.value })}
            placeholder="Enter value"
            className="h-8"
          />
        );
    }
  };

  const hasFilters = conditions.length > 0 || groups.length > 0;

  const handleApply = () => {
    onApplyFilters({ conditions, groups });
    onClose();
  };

  const handleClear = () => {
    setConditions([]);
    setGroups([]);
    onApplyFilters({ conditions: [], groups: [] });
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Info message */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <Info className="h-4 w-4" />
              <span>
                {hasFilters 
                  ? `${conditions.length + groups.reduce((acc, g) => acc + g.conditions.length, 0)} filter condition${conditions.length + groups.reduce((acc, g) => acc + g.conditions.length, 0) !== 1 ? 's' : ''} applied`
                  : 'No filter conditions are applied'
                }
              </span>
            </div>

            {/* Individual Conditions */}
            {conditions.map((condition, index) => {
              const field = fields.find(f => f.id === condition.field);
              const operators = getOperatorsForFieldType(field?.field_type || 'single_line');
              
              return (
                <div key={condition.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background">
                  {index > 0 && (
                    <span className="text-xs text-muted-foreground font-medium px-2">AND</span>
                  )}
                  
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(condition.id, { field: value, operator: 'equals', value: '' })}
                  >
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      {fields.map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(condition.id, { operator: value, value: '' })}
                  >
                    <SelectTrigger className="w-48 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      {operators.map(op => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1">
                    {renderValueInput(condition)}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}

            {/* Groups */}
            {groups.map((group, groupIndex) => (
              <div key={group.id} className="border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {(conditions.length > 0 || groupIndex > 0) && (
                      <span className="text-xs text-muted-foreground font-medium px-2">AND</span>
                    )}
                    <Select
                      value={group.operator}
                      onValueChange={(value: 'AND' | 'OR') => updateGroupOperator(group.id, value)}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md z-50">
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">group</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGroup(group.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {group.conditions.map((condition, condIndex) => {
                  const field = fields.find(f => f.id === condition.field);
                  const operators = getOperatorsForFieldType(field?.field_type || 'single_line');
                  
                  return (
                    <div key={condition.id} className="flex items-center gap-2 mb-2 last:mb-0">
                      {condIndex > 0 && (
                        <span className="text-xs text-muted-foreground font-medium px-2">
                          {group.operator}
                        </span>
                      )}
                      
                      <Select
                        value={condition.field}
                        onValueChange={(value) => updateGroupCondition(group.id, condition.id, { field: value, operator: 'equals', value: '' })}
                      >
                        <SelectTrigger className="w-48 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-50">
                          {fields.map(field => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateGroupCondition(group.id, condition.id, { operator: value, value: '' })}
                      >
                        <SelectTrigger className="w-48 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md z-50">
                          {operators.map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex-1">
                        {renderGroupValueInput(group.id, condition)}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConditionFromGroup(group.id, condition.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addConditionToGroup(group.id)}
                  className="mt-2 text-primary hover:text-primary h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add condition
                </Button>
              </div>
            ))}

            {/* Add buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={addCondition}
                className="text-primary hover:text-primary"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add condition
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={addConditionGroup}
                className="text-primary hover:text-primary"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add condition group
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Group conditions together with AND/OR logic</p>
                  </TooltipContent>
                </Tooltip>
              </Button>

              <div className="flex-1" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* TODO: Implement copy from another view */}}
                className="text-muted-foreground"
              >
                Copy from another view
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={!hasFilters}
              >
                Clear all
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleApply}>
                  Apply filters
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};