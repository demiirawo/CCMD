import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { evaluateFormula, formatFormulaResult } from '@/utils/formulaEngine';

interface FormulaEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formula: string) => void;
  initialFormula?: string;
  fields: Array<{ id: string; name: string; field_type: string }>;
  sampleRecord?: Record<string, any>;
}

const FUNCTION_CATEGORIES = {
  'Conditional': ['IF', 'SWITCH', 'IS_BLANK', 'BLANK'],
  'Logical': ['AND', 'OR', 'NOT'],
  'Date & Time': ['TODAY', 'NOW', 'DATETIME_PARSE', 'DATETIME_FORMAT', 'SET_TIMEZONE', 'DATEADD', 'DATETIME_DIFF', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'WEEKNUM', 'WEEKDAY', 'WORKDAY', 'WORKDAY_DIFF'],
  'Text': ['LEFT', 'RIGHT', 'MID', 'LEN', 'TRIM', 'LOWER', 'UPPER', 'PROPER', 'FIND', 'SUBSTITUTE', 'REGEX_MATCH', 'REGEX_EXTRACT', 'REGEX_REPLACE'],
  'Numbers': ['ROUND', 'ROUNDUP', 'ROUNDDOWN', 'ABS', 'CEILING', 'FLOOR', 'POWER', 'SQRT', 'VALUE', 'MOD'],
  'Arrays': ['ARRAYJOIN', 'ARRAYUNIQUE', 'ARRAYCOMPACT']
};

const FUNCTION_DOCS = {
  'IF': 'IF(condition, value_if_true, value_if_false)\nReturns one value if condition is true, another if false.',
  'SWITCH': 'SWITCH(expr, val1, out1, val2, out2, ..., default)\nCompares expr to multiple values and returns corresponding output.',
  'AND': 'AND(logical1, logical2, ...)\nReturns TRUE if all arguments are true.',
  'OR': 'OR(logical1, logical2, ...)\nReturns TRUE if any argument is true.',
  'NOT': 'NOT(logical)\nReturns the opposite of a logical value.',
  'IS_BLANK': 'IS_BLANK(value)\nReturns TRUE if value is blank.',
  'BLANK': 'BLANK()\nReturns a blank value.',
  'TODAY': 'TODAY()\nReturns the current date.',
  'NOW': 'NOW()\nReturns the current date and time.',
  'DATETIME_FORMAT': 'DATETIME_FORMAT(date, format, [timezone])\nFormats a date using the specified format string.',
  'YEAR': 'YEAR(date)\nExtracts the year from a date.',
  'MONTH': 'MONTH(date)\nExtracts the month from a date (1-12).',
  'DAY': 'DAY(date)\nExtracts the day from a date.',
  'LEN': 'LEN(text)\nReturns the length of text.',
  'TRIM': 'TRIM(text)\nRemoves leading and trailing spaces.',
  'UPPER': 'UPPER(text)\nConverts text to uppercase.',
  'LOWER': 'LOWER(text)\nConverts text to lowercase.',
  'ROUND': 'ROUND(number, [precision])\nRounds a number to specified decimal places.',
  'VALUE': 'VALUE(text)\nConverts text to a number.',
};

export const FormulaEditor = ({ isOpen, onClose, onSave, initialFormula = '', fields, sampleRecord = {} }: FormulaEditorProps) => {
  const [formula, setFormula] = useState(initialFormula);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Conditional');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (formula && sampleRecord) {
      try {
        const fieldNames = fields.reduce((acc, field) => {
          acc[field.id] = field.name;
          return acc;
        }, {} as Record<string, string>);

        const result = evaluateFormula(formula, sampleRecord, [sampleRecord], fieldNames);
        setPreviewResult(formatFormulaResult(result));
      } catch (error) {
        setPreviewResult('#ERROR!');
      }
    } else {
      setPreviewResult('');
    }
  }, [formula, sampleRecord, fields]);

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newFormula = formula.substring(0, start) + text + formula.substring(end);
    
    setFormula(newFormula);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const insertField = (fieldName: string) => {
    insertText(`{${fieldName}}`);
  };

  const insertFunction = (functionName: string) => {
    insertText(`${functionName}()`);
  };

  const handleSave = () => {
    onSave(formula);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Formula Editor</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
          {/* Formula Input */}
          <div className="col-span-2 flex flex-col gap-4">
            <div>
              <Label htmlFor="formula">Formula</Label>
              <Textarea
                ref={textareaRef}
                id="formula"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Enter your formula here..."
                className="min-h-32 font-mono text-sm bg-white"
              />
            </div>
            
            {/* Preview */}
            <div>
              <Label>Preview Result</Label>
              <div className="p-3 bg-muted rounded-md min-h-12 flex items-center">
                <code className={previewResult === '#ERROR!' ? 'text-destructive' : ''}>
                  {previewResult || 'Enter a formula to see preview'}
                </code>
              </div>
            </div>

            {/* Field References */}
            <div>
              <Label>Available Fields</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
                {fields.map((field) => (
                  <Badge
                    key={field.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => insertField(field.name)}
                  >
                    {field.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Function Library */}
          <div className="flex flex-col gap-4">
            <div>
              <Label>Function Library</Label>
              <div className="flex flex-wrap gap-1">
                {Object.keys(FUNCTION_CATEGORIES).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-2">
              <div className="space-y-2">
                {FUNCTION_CATEGORIES[selectedCategory as keyof typeof FUNCTION_CATEGORIES]?.map((func) => (
                  <div key={func} className="group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start font-mono"
                      onClick={() => insertFunction(func)}
                    >
                      {func}()
                    </Button>
                    {FUNCTION_DOCS[func as keyof typeof FUNCTION_DOCS] && (
                      <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <pre className="whitespace-pre-wrap font-mono">
                          {FUNCTION_DOCS[func as keyof typeof FUNCTION_DOCS]}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Formula
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};