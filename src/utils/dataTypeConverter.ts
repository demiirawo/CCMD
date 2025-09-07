/**
 * Utility functions for converting data between different field types
 */

export interface ConversionResult {
  convertedValue: any;
  wasConverted: boolean;
}

/**
 * Converts a value from one field type to another
 */
export function convertFieldValue(
  value: any,
  fromType: string,
  toType: string,
  fieldConfig?: any
): ConversionResult {
  // If value is null, undefined, or empty string, return appropriate default for new type
  if (value === null || value === undefined || value === '') {
    return { convertedValue: getDefaultValueForType(toType), wasConverted: true };
  }

  // Same type, no conversion needed
  if (fromType === toType) {
    return { convertedValue: value, wasConverted: true };
  }

  try {
    // Text-based conversions
    if (isTextType(fromType) && isTextType(toType)) {
      return { convertedValue: String(value), wasConverted: true };
    }

    // Text to select conversions
    if (isTextType(fromType) && isSelectType(toType)) {
      const stringValue = String(value).trim();
      if (!stringValue) {
        return { convertedValue: getDefaultValueForType(toType), wasConverted: true };
      }

      // For single_select, try to match existing options or create new one
      if (toType === 'single_select') {
        const options = fieldConfig?.options || [];
        const existingOption = options.find((opt: any) => 
          opt.name.toLowerCase() === stringValue.toLowerCase()
        );
        if (existingOption) {
          return { convertedValue: existingOption.id, wasConverted: true };
        }
        // If no existing option matches, return empty (will be cleared)
        return { convertedValue: '', wasConverted: false };
      }

      // For multi_select, split by common delimiters and match options
      if (toType === 'multi_select') {
        const options = fieldConfig?.options || [];
        const values = stringValue.split(/[,;|]/).map(v => v.trim()).filter(Boolean);
        const matchedIds: string[] = [];
        
        values.forEach(val => {
          const existingOption = options.find((opt: any) => 
            opt.name.toLowerCase() === val.toLowerCase()
          );
          if (existingOption) {
            matchedIds.push(existingOption.id);
          }
        });

        return { convertedValue: matchedIds, wasConverted: matchedIds.length > 0 };
      }
    }

    // Select to text conversions
    if (isSelectType(fromType) && isTextType(toType)) {
      if (fromType === 'single_select') {
        const options = fieldConfig?.options || [];
        const option = options.find((opt: any) => opt.id === value);
        return { convertedValue: option?.name || '', wasConverted: true };
      }

      if (fromType === 'multi_select' && Array.isArray(value)) {
        const options = fieldConfig?.options || [];
        const names = value.map(id => {
          const option = options.find((opt: any) => opt.id === id);
          return option?.name;
        }).filter(Boolean);
        return { convertedValue: names.join(', '), wasConverted: true };
      }
    }

    // Number conversions
    if (isNumberType(fromType) && isNumberType(toType)) {
      return { convertedValue: Number(value), wasConverted: true };
    }

    // Text to number conversions
    if (isTextType(fromType) && isNumberType(toType)) {
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return { convertedValue: num, wasConverted: true };
      }
      return { convertedValue: 0, wasConverted: false };
    }

    // Number to text conversions
    if (isNumberType(fromType) && isTextType(toType)) {
      return { convertedValue: String(value), wasConverted: true };
    }

    // Checkbox conversions
    if (fromType === 'checkbox') {
      if (isTextType(toType)) {
        return { convertedValue: value ? 'Yes' : 'No', wasConverted: true };
      }
      if (isNumberType(toType)) {
        return { convertedValue: value ? 1 : 0, wasConverted: true };
      }
    }

    if (toType === 'checkbox') {
      if (isTextType(fromType)) {
        const stringValue = String(value).toLowerCase();
        const truthyValues = ['true', 'yes', '1', 'on', 'checked'];
        return { convertedValue: truthyValues.includes(stringValue), wasConverted: true };
      }
      if (isNumberType(fromType)) {
        return { convertedValue: Number(value) > 0, wasConverted: true };
      }
    }

    // Date conversions
    if (isDateType(fromType) && isDateType(toType)) {
      return { convertedValue: value, wasConverted: true };
    }

    if (isTextType(fromType) && isDateType(toType)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return { convertedValue: date.toISOString(), wasConverted: true };
      }
      return { convertedValue: null, wasConverted: false };
    }

    if (isDateType(fromType) && isTextType(toType)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return { convertedValue: date.toLocaleDateString(), wasConverted: true };
      }
      return { convertedValue: '', wasConverted: false };
    }

    // Rating conversions
    if (fromType === 'rating' && isNumberType(toType)) {
      return { convertedValue: Number(value), wasConverted: true };
    }

    if (isNumberType(fromType) && toType === 'rating') {
      const num = Number(value);
      const max = fieldConfig?.max || 5;
      if (num >= 0 && num <= max) {
        return { convertedValue: num, wasConverted: true };
      }
      return { convertedValue: 0, wasConverted: false };
    }

    // If no conversion rule matches, clear the value
    return { convertedValue: getDefaultValueForType(toType), wasConverted: false };

  } catch (error) {
    console.error('Error converting field value:', error);
    return { convertedValue: getDefaultValueForType(toType), wasConverted: false };
  }
}

/**
 * Get default value for a field type
 */
function getDefaultValueForType(fieldType: string): any {
  switch (fieldType) {
    case 'single_line':
    case 'long_text':
      return '';
    case 'single_select':
      return '';
    case 'multi_select':
      return [];
    case 'checkbox':
      return false;
    case 'number':
    case 'currency':
    case 'percent':
    case 'rating':
      return 0;
    case 'date':
    case 'datetime':
      return null;
    case 'attachment':
      return [];
    case 'formula':
      return '';
    default:
      return null;
  }
}

/**
 * Check if field type is text-based
 */
function isTextType(fieldType: string): boolean {
  return ['single_line', 'long_text'].includes(fieldType);
}

/**
 * Check if field type is select-based
 */
function isSelectType(fieldType: string): boolean {
  return ['single_select', 'multi_select'].includes(fieldType);
}

/**
 * Check if field type is number-based
 */
function isNumberType(fieldType: string): boolean {
  return ['number', 'currency', 'percent', 'rating'].includes(fieldType);
}

/**
 * Check if field type is date-based
 */
function isDateType(fieldType: string): boolean {
  return ['date', 'datetime'].includes(fieldType);
}

/**
 * Convert all records data for a field type change
 */
export function convertRecordsForFieldTypeChange(
  records: any[],
  fieldId: string,
  fromType: string,
  toType: string,
  fieldConfig?: any
): { updatedRecords: any[], conversionLog: { recordId: string, converted: boolean, oldValue: any, newValue: any }[] } {
  const updatedRecords = [...records];
  const conversionLog: { recordId: string, converted: boolean, oldValue: any, newValue: any }[] = [];

  updatedRecords.forEach(record => {
    const oldValue = record.data[fieldId];
    const conversion = convertFieldValue(oldValue, fromType, toType, fieldConfig);
    
    record.data = {
      ...record.data,
      [fieldId]: conversion.convertedValue
    };

    conversionLog.push({
      recordId: record.id,
      converted: conversion.wasConverted,
      oldValue,
      newValue: conversion.convertedValue
    });
  });

  return { updatedRecords, conversionLog };
}