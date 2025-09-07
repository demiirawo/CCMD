import { useMemo } from 'react';
import { evaluateFormula, formatFormulaResult } from '@/utils/formulaEngine';

interface FormulaCellProps {
  formula: string;
  recordData: Record<string, any>;
  allRecords: Array<Record<string, any>>;
  fieldNames: Record<string, string>;
  format?: any;
  isEditing?: boolean;
  onEdit?: () => void;
}

export const FormulaCell = ({ formula, recordData, allRecords, fieldNames, format, isEditing, onEdit }: FormulaCellProps) => {
  const result = useMemo(() => {
    if (!formula) return '';
    
    console.log('FormulaCell evaluation:', {
      formula,
      recordData,
      fieldNames,
      allRecords: allRecords.length
    });
    
    try {
      const value = evaluateFormula(formula, recordData, allRecords, fieldNames);
      console.log('Formula result:', value);
      return formatFormulaResult(value, format);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return '#ERROR!';
    }
  }, [formula, recordData, allRecords, fieldNames, format]);

  if (isEditing) {
    return (
      <div className="px-3 py-2">
        <input
          type="text"
          value={formula}
          readOnly
          className="w-full bg-muted/50 border rounded px-2 py-1 text-sm font-mono"
          onClick={onEdit}
          placeholder="Click to edit formula"
        />
      </div>
    );
  }

  return (
    <div 
      className={`px-3 py-2 cursor-pointer hover:bg-muted/30 ${result === '#ERROR!' ? 'text-destructive' : ''}`}
      onClick={onEdit}
      title="Click to edit formula"
    >
      {result || <span className="text-muted-foreground italic">No result</span>}
    </div>
  );
};