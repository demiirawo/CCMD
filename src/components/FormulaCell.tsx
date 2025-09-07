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
    
    try {
      const value = evaluateFormula(formula, recordData, allRecords, fieldNames);
      return formatFormulaResult(value, format);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return '#ERROR!';
    }
  }, [formula, recordData, allRecords, fieldNames, format]);

  if (isEditing) {
    return (
      <input
        type="text"
        value={formula}
        readOnly
        className="w-full bg-white border rounded px-2 py-1 text-sm font-mono"
        onClick={onEdit}
        placeholder="Click to edit formula"
      />
    );
  }

  return (
    <div 
      className={`w-full h-full flex items-center cursor-pointer ${
        result === '#ERROR!' ? 'text-destructive font-medium' : 
        result ? 'text-foreground' : 'text-muted-foreground'
      }`}
      onClick={onEdit}
      title={`Formula: ${formula}`}
    >
      {result ? (
        <span className="font-medium truncate">{result}</span>
      ) : (
        <span className="italic text-muted-foreground">No result</span>
      )}
    </div>
  );
};