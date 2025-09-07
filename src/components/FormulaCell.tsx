import { useMemo } from 'react';
import { evaluateFormula, formatFormulaResult } from '@/utils/formulaEngine';

interface FormulaCellProps {
  formula: string;
  recordData: Record<string, any>;
  allRecords: Array<Record<string, any>>;
  fieldNames: Record<string, string>;
  format?: any;
}

export const FormulaCell = ({ formula, recordData, allRecords, fieldNames, format }: FormulaCellProps) => {
  const result = useMemo(() => {
    if (!formula) return '';
    
    const value = evaluateFormula(formula, recordData, allRecords, fieldNames);
    return formatFormulaResult(value, format);
  }, [formula, recordData, allRecords, fieldNames, format]);

  return (
    <div className={`px-3 py-2 ${result === '#ERROR!' ? 'text-destructive' : ''}`}>
      {result}
    </div>
  );
};