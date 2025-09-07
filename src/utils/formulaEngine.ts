import { 
  format, 
  parse, 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  addHours, 
  addMinutes, 
  addSeconds, 
  differenceInDays, 
  differenceInHours, 
  differenceInMinutes, 
  differenceInSeconds, 
  differenceInMonths, 
  differenceInYears, 
  differenceInWeeks, 
  getYear, 
  getMonth, 
  getDate, 
  getHours, 
  getMinutes, 
  getSeconds, 
  getWeek, 
  getDay, 
  isWeekend,
  startOfDay,
  endOfDay,
  isValid,
  getUnixTime,
  fromUnixTime
} from 'date-fns';
import { fromZonedTime, toZonedTime, format as formatTz } from 'date-fns-tz';

export type FormulaValue = string | number | boolean | Date | null | undefined | FormulaValue[];

interface FormulaContext {
  recordData: Record<string, any>;
  allRecords: Array<Record<string, any>>;
  fieldNames: Record<string, string>; // fieldId -> fieldName mapping
}

// Parser for Airtable-style formulas
class FormulaParser {
  private tokens: string[] = [];
  private current = 0;

  parse(formula: string): FormulaNode {
    this.tokens = this.tokenize(formula);
    this.current = 0;
    return this.expression();
  }

  private tokenize(formula: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    
    while (i < formula.length) {
      const char = formula[i];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }
      
      // String literals
      if (char === '"' || char === "'") {
        const quote = char;
        let str = '';
        i++; // Skip opening quote
        while (i < formula.length && formula[i] !== quote) {
          if (formula[i] === '\\') {
            i++; // Skip escape character
            if (i < formula.length) {
              str += formula[i];
            }
          } else {
            str += formula[i];
          }
          i++;
        }
        i++; // Skip closing quote
        tokens.push(`"${str}"`);
        continue;
      }
      
      // Field references {Field Name}
      if (char === '{') {
        let field = '';
        i++; // Skip opening brace
        while (i < formula.length && formula[i] !== '}') {
          field += formula[i];
          i++;
        }
        i++; // Skip closing brace
        tokens.push(`{${field}}`);
        continue;
      }
      
      // Numbers
      if (/\d/.test(char) || (char === '.' && /\d/.test(formula[i + 1]))) {
        let num = '';
        while (i < formula.length && (/\d/.test(formula[i]) || formula[i] === '.')) {
          num += formula[i];
          i++;
        }
        tokens.push(num);
        continue;
      }
      
      // Operators and punctuation
      if (['(', ')', ',', '+', '-', '*', '/', '&', '=', '!', '<', '>'].includes(char)) {
        if (char === '!' && formula[i + 1] === '=') {
          tokens.push('!=');
          i += 2;
        } else if (char === '<' && formula[i + 1] === '=') {
          tokens.push('<=');
          i += 2;
        } else if (char === '>' && formula[i + 1] === '=') {
          tokens.push('>=');
          i += 2;
        } else {
          tokens.push(char);
          i++;
        }
        continue;
      }
      
      // Identifiers and function names
      if (/[a-zA-Z_]/.test(char)) {
        let identifier = '';
        while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
          identifier += formula[i];
          i++;
        }
        tokens.push(identifier);
        continue;
      }
      
      i++;
    }
    
    return tokens;
  }

  private expression(): FormulaNode {
    return this.logicalOr();
  }

  private logicalOr(): FormulaNode {
    let left = this.logicalAnd();
    
    while (this.match('OR')) {
      const operator = this.previous();
      const right = this.logicalAnd();
      left = { type: 'function', name: 'OR', args: [left, right] };
    }
    
    return left;
  }

  private logicalAnd(): FormulaNode {
    let left = this.equality();
    
    while (this.match('AND')) {
      const operator = this.previous();
      const right = this.equality();
      left = { type: 'function', name: 'AND', args: [left, right] };
    }
    
    return left;
  }

  private equality(): FormulaNode {
    let left = this.comparison();
    
    while (this.match('=', '!=')) {
      const operator = this.previous();
      const right = this.comparison();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  }

  private comparison(): FormulaNode {
    let left = this.concatenation();
    
    while (this.match('>', '>=', '<', '<=')) {
      const operator = this.previous();
      const right = this.concatenation();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  }

  private concatenation(): FormulaNode {
    let left = this.addition();
    
    while (this.match('&')) {
      const operator = this.previous();
      const right = this.addition();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  }

  private addition(): FormulaNode {
    let left = this.multiplication();
    
    while (this.match('+', '-')) {
      const operator = this.previous();
      const right = this.multiplication();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  }

  private multiplication(): FormulaNode {
    let left = this.unary();
    
    while (this.match('*', '/')) {
      const operator = this.previous();
      const right = this.unary();
      left = { type: 'binary', operator, left, right };
    }
    
    return left;
  }

  private unary(): FormulaNode {
    if (this.match('-', 'NOT')) {
      const operator = this.previous();
      const right = this.unary();
      if (operator === 'NOT') {
        return { type: 'function', name: 'NOT', args: [right] };
      }
      return { type: 'unary', operator, operand: right };
    }
    
    return this.primary();
  }

  private primary(): FormulaNode {
    // Function calls
    if (this.checkNext('(')) {
      const name = this.advance();
      this.consume('(');
      const args: FormulaNode[] = [];
      
      if (!this.check(')')) {
        do {
          args.push(this.expression());
        } while (this.match(','));
      }
      
      this.consume(')');
      return { type: 'function', name, args };
    }
    
    // Field references
    if (this.peek().startsWith('{')) {
      const token = this.advance();
      const fieldName = token.slice(1, -1); // Remove braces
      return { type: 'field', name: fieldName };
    }
    
    // String literals
    if (this.peek().startsWith('"')) {
      const token = this.advance();
      return { type: 'literal', value: token.slice(1, -1) }; // Remove quotes
    }
    
    // Numbers
    if (/^\d/.test(this.peek()) || this.peek().startsWith('.')) {
      const token = this.advance();
      return { type: 'literal', value: parseFloat(token) };
    }
    
    // Parenthesized expressions
    if (this.match('(')) {
      const expr = this.expression();
      this.consume(')');
      return expr;
    }
    
    // Identifiers (TRUE, FALSE, etc.)
    const token = this.advance();
    if (token === 'TRUE') return { type: 'literal', value: true };
    if (token === 'FALSE') return { type: 'literal', value: false };
    
    throw new Error(`Unexpected token: ${token}`);
  }

  private match(...types: string[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: string): boolean {
    if (this.isAtEnd()) return false;
    return this.peek() === type;
  }

  private checkNext(type: string): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    return this.tokens[this.current + 1] === type;
  }

  private advance(): string {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private peek(): string {
    return this.tokens[this.current] || '';
  }

  private previous(): string {
    return this.tokens[this.current - 1];
  }

  private consume(type: string): void {
    if (this.check(type)) {
      this.advance();
      return;
    }
    throw new Error(`Expected ${type} but got ${this.peek()}`);
  }
}

interface FormulaNode {
  type: 'literal' | 'field' | 'binary' | 'unary' | 'function';
  value?: any;
  name?: string;
  operator?: string;
  left?: FormulaNode;
  right?: FormulaNode;
  operand?: FormulaNode;
  args?: FormulaNode[];
}

// Formula evaluator
class FormulaEvaluator {
  private context: FormulaContext;
  private volatileCache = new Map<string, { value: any; timestamp: number }>();

  constructor(context: FormulaContext) {
    this.context = context;
  }

  evaluate(node: FormulaNode): FormulaValue {
    try {
      return this._evaluate(node);
    } catch (error) {
      return '#ERROR!';
    }
  }

  private _evaluate(node: FormulaNode): FormulaValue {
    switch (node.type) {
      case 'literal':
        return node.value;
        
      case 'field':
        return this.getFieldValue(node.name!);
        
      case 'binary':
        return this.evaluateBinary(node);
        
      case 'unary':
        return this.evaluateUnary(node);
        
      case 'function':
        return this.evaluateFunction(node);
        
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private getFieldValue(fieldName: string): FormulaValue {
    console.log('getFieldValue called with:', { 
      fieldName, 
      fieldNames: this.context.fieldNames,
      recordData: this.context.recordData 
    });
    
    // Find field ID by name
    const fieldId = Object.keys(this.context.fieldNames).find(
      id => this.context.fieldNames[id] === fieldName
    );
    
    console.log('Field lookup result:', { fieldName, fieldId });
    
    if (!fieldId) {
      console.error(`Field not found: ${fieldName}. Available fields:`, this.context.fieldNames);
      throw new Error(`Field not found: ${fieldName}`);
    }
    
    const value = this.context.recordData[fieldId];
    console.log('Field value retrieved:', { fieldName, fieldId, value });
    return value;
  }

  private evaluateBinary(node: FormulaNode): FormulaValue {
    const left = this._evaluate(node.left!);
    const right = this._evaluate(node.right!);
    
    // Handle blank propagation
    if (this.isBlank(left) || this.isBlank(right)) {
      if (node.operator === '&') {
        return this.toString(left) + this.toString(right);
      }
      return null;
    }
    
    switch (node.operator) {
      case '+':
        return this.toNumber(left) + this.toNumber(right);
      case '-':
        return this.toNumber(left) - this.toNumber(right);
      case '*':
        return this.toNumber(left) * this.toNumber(right);
      case '/':
        const divisor = this.toNumber(right);
        if (divisor === 0) throw new Error('Division by zero');
        return this.toNumber(left) / divisor;
      case '&':
        return this.toString(left) + this.toString(right);
      case '=':
        return this.compareValues(left, right) === 0;
      case '!=':
        return this.compareValues(left, right) !== 0;
      case '>':
        return this.compareValues(left, right) > 0;
      case '>=':
        return this.compareValues(left, right) >= 0;
      case '<':
        return this.compareValues(left, right) < 0;
      case '<=':
        return this.compareValues(left, right) <= 0;
      default:
        throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  private evaluateUnary(node: FormulaNode): FormulaValue {
    const operand = this._evaluate(node.operand!);
    
    switch (node.operator) {
      case '-':
        if (this.isBlank(operand)) return null;
        return -this.toNumber(operand);
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  private evaluateFunction(node: FormulaNode): FormulaValue {
    const args = node.args?.map(arg => this._evaluate(arg)) || [];
    
    switch (node.name?.toUpperCase()) {
      // Conditional functions
      case 'IF':
        if (args.length < 2) throw new Error('IF requires at least 2 arguments');
        const condition = this.toBool(args[0]);
        return condition ? args[1] : (args[2] || null);
        
      case 'SWITCH':
        if (args.length < 3) throw new Error('SWITCH requires at least 3 arguments');
        const expr = args[0];
        for (let i = 1; i < args.length - 1; i += 2) {
          if (this.compareValues(expr, args[i]) === 0) {
            return args[i + 1];
          }
        }
        return args.length % 2 === 0 ? args[args.length - 1] : null;
        
      // Logical functions
      case 'AND':
        return args.every(arg => this.toBool(arg));
        
      case 'OR':
        return args.some(arg => this.toBool(arg));
        
      case 'NOT':
        if (args.length !== 1) throw new Error('NOT requires 1 argument');
        return !this.toBool(args[0]);
        
      // Blank functions
      case 'IS_BLANK':
        if (args.length !== 1) throw new Error('IS_BLANK requires 1 argument');
        return this.isBlank(args[0]);
        
      case 'BLANK':
        return null;
        
      // Type checking functions
      case 'IS_NUMBER':
        if (args.length !== 1) throw new Error('IS_NUMBER requires 1 argument');
        return typeof args[0] === 'number' && !isNaN(args[0]);
        
      case 'IS_STRING':
        if (args.length !== 1) throw new Error('IS_STRING requires 1 argument');
        return typeof args[0] === 'string';
        
      case 'IS_LOGICAL':
        if (args.length !== 1) throw new Error('IS_LOGICAL requires 1 argument');
        return typeof args[0] === 'boolean';
        
      case 'IS_ERROR':
        if (args.length !== 1) throw new Error('IS_ERROR requires 1 argument');
        return args[0] === '#ERROR!' || (typeof args[0] === 'string' && args[0].startsWith('#'));
        
        
      // Date functions
      case 'TODAY':
        return this.getVolatileValue('TODAY', () => {
          // Get current date in Europe/London timezone at midnight
          const now = new Date();
          const londonTime = toZonedTime(now, 'Europe/London');
          const todayMidnight = startOfDay(londonTime);
          return fromZonedTime(todayMidnight, 'Europe/London');
        });
        
      case 'NOW':
        return this.getVolatileValue('NOW', () => new Date());
        
      case 'DATETIME_PARSE':
        return this.datetimeParse(args[0], args[1], args[2]);
        
      case 'DATETIME_FORMAT':
        return this.datetimeFormat(args[0], args[1], args[2]);
        
      case 'SET_TIMEZONE':
        return this.setTimezone(args[0], args[1]);
        
      case 'DATEADD':
        return this.dateAdd(args[0], args[1], args[2]);
        
      case 'DATETIME_DIFF':
        return this.datetimeDiff(args[0], args[1], args[2], args[3]);
        
      case 'YEAR':
        return this.isBlank(args[0]) ? null : getYear(this.toDate(args[0]));
      case 'MONTH':
        return this.isBlank(args[0]) ? null : getMonth(this.toDate(args[0])) + 1;
      case 'DAY':
        return this.isBlank(args[0]) ? null : getDate(this.toDate(args[0]));
      case 'HOUR':
        return this.isBlank(args[0]) ? null : getHours(this.toDate(args[0]));
      case 'MINUTE':
        return this.isBlank(args[0]) ? null : getMinutes(this.toDate(args[0]));
      case 'SECOND':
        return this.isBlank(args[0]) ? null : getSeconds(this.toDate(args[0]));
      case 'WEEKNUM':
        return this.isBlank(args[0]) ? null : getWeek(this.toDate(args[0]));
      case 'WEEKDAY':
        return this.isBlank(args[0]) ? null : ((getDay(this.toDate(args[0])) + 6) % 7) + 1; // Monday = 1
        
      case 'WORKDAY':
        return this.workday(args[0], args[1]);
        
      case 'WORKDAY_DIFF':
        return this.workdayDiff(args[0], args[1]);
        
      // Text functions
      case 'LEFT':
        return this.left(args[0], args[1]);
      case 'RIGHT':
        return this.right(args[0], args[1]);
      case 'MID':
        return this.mid(args[0], args[1], args[2]);
      case 'LEN':
        return this.isBlank(args[0]) ? 0 : this.toString(args[0]).length;
      case 'TRIM':
        return this.isBlank(args[0]) ? null : this.toString(args[0]).trim();
      case 'LOWER':
        return this.isBlank(args[0]) ? null : this.toString(args[0]).toLowerCase();
      case 'UPPER':
        return this.isBlank(args[0]) ? null : this.toString(args[0]).toUpperCase();
      case 'PROPER':
        return this.isBlank(args[0]) ? null : this.proper(this.toString(args[0]));
      case 'FIND':
        return this.find(args[0], args[1], args[2]);
      case 'SUBSTITUTE':
        return this.substitute(args[0], args[1], args[2]);
      case 'REGEX_MATCH':
        return this.regexMatch(args[0], args[1]);
      case 'REGEX_EXTRACT':
        return this.regexExtract(args[0], args[1]);
      case 'REGEX_REPLACE':
        return this.regexReplace(args[0], args[1], args[2]);
      
      case 'CONCATENATE':
        return args.map(arg => this.toString(arg)).join('');
        
      case 'REPT':
        if (args.length !== 2) throw new Error('REPT requires 2 arguments');
        const text = this.toString(args[0]);
        const times = this.toNumber(args[1]);
        return text.repeat(Math.max(0, Math.floor(times)));
        
        
      // Number functions
      case 'ROUND':
        return this.round(args[0], args[1]);
      case 'ROUNDUP':
        return this.roundUp(args[0], args[1]);
      case 'ROUNDDOWN':
        return this.roundDown(args[0], args[1]);
      case 'ABS':
        return this.isBlank(args[0]) ? null : Math.abs(this.toNumber(args[0]));
      case 'CEILING':
        return this.isBlank(args[0]) ? null : Math.ceil(this.toNumber(args[0]));
      case 'FLOOR':
        return this.isBlank(args[0]) ? null : Math.floor(this.toNumber(args[0]));
      case 'POWER':
        return this.isBlank(args[0]) || this.isBlank(args[1]) ? null : Math.pow(this.toNumber(args[0]), this.toNumber(args[1]));
      case 'SQRT':
        return this.isBlank(args[0]) ? null : Math.sqrt(this.toNumber(args[0]));
      case 'VALUE':
        return this.value(args[0]);
      case 'MOD':
        return this.mod(args[0], args[1]);
        
      // Aggregate functions
      case 'SUM':
        return this.sum(args);
      case 'MAX':
        return this.max(args);
      case 'MIN':
        return this.min(args);
      case 'AVERAGE':
        return this.average(args);
      case 'COUNT':
        return this.count(args);
      case 'COUNTA':
        return this.countA(args);
        
        
      // Array functions
      case 'ARRAYJOIN':
        return this.arrayJoin(args[0], args[1]);
      case 'ARRAYUNIQUE':
        return this.arrayUnique(args[0]);
      case 'ARRAYCOMPACT':
        return this.arrayCompact(args[0]);
        
      default:
        throw new Error(`Unknown function: ${node.name}`);
    }
  }

  // Helper methods for type conversion and comparison
  private isBlank(value: FormulaValue): boolean {
    return value === null || value === undefined || value === '';
  }

  private toString(value: FormulaValue): string {
    if (this.isBlank(value)) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }

  private toNumber(value: FormulaValue): number {
    if (this.isBlank(value)) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  private toBool(value: FormulaValue): boolean {
    if (this.isBlank(value)) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value !== '';
    return true;
  }

  private toDate(value: FormulaValue): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      // Strict European date parsing - only DD/MM/YYYY and DD/MM/YYYY HH:mm[:ss]
      
      // Check for DD/MM/YYYY HH:mm:ss format
      const fullDateTimeMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
      if (fullDateTimeMatch) {
        const [, day, month, year, hour, minute, second] = fullDateTimeMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        if (!isValid(date) || date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1) {
          throw new Error('Invalid European date');
        }
        return date;
      }
      
      // Check for DD/MM/YYYY HH:mm format
      const dateTimeMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
      if (dateTimeMatch) {
        const [, day, month, year, hour, minute] = dateTimeMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        if (!isValid(date) || date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1) {
          throw new Error('Invalid European date');
        }
        return date;
      }
      
      // Check for DD/MM/YYYY format
      const dateMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isValid(date) || date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1) {
          throw new Error('Invalid European date');
        }
        return date;
      }
      
      // Reject all other formats including ISO dates, US dates, etc.
      throw new Error('Date must be in DD/MM/YYYY format');
    }
    if (typeof value === 'number') return new Date(value);
    throw new Error('Cannot convert to date');
  }

  private compareValues(a: FormulaValue, b: FormulaValue): number {
    if (this.isBlank(a) && this.isBlank(b)) return 0;
    if (this.isBlank(a)) return -1;
    if (this.isBlank(b)) return 1;
    
    const aStr = this.toString(a);
    const bStr = this.toString(b);
    
    if (aStr < bStr) return -1;
    if (aStr > bStr) return 1;
    return 0;
  }

  private getVolatileValue(key: string, generator: () => any): any {
    const now = Date.now();
    const cached = this.volatileCache.get(key);
    
    // Cache for 1 minute
    if (cached && now - cached.timestamp < 60000) {
      return cached.value;
    }
    
    const value = generator();
    this.volatileCache.set(key, { value, timestamp: now });
    return value;
  }

  // Date function implementations
  private datetimeParse(text: any, formatStr?: any, timezone?: any): Date | null {
    if (this.isBlank(text)) return null;
    try {
      const textStr = this.toString(text);
      const tz = timezone ? this.toString(timezone) : 'Europe/London';
      
      if (formatStr) {
        // Use provided format string
        const format = this.toString(formatStr);
        const parsedDate = parse(textStr, format, new Date());
        if (!isValid(parsedDate)) {
          throw new Error('Invalid date format');
        }
        return fromZonedTime(parsedDate, tz);
      }
      
      // Default parsing - strict European formats only
      // Check for DD/MM/YYYY HH:mm:ss format
      const fullDateTimeMatch = textStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
      if (fullDateTimeMatch) {
        const [, day, month, year, hour, minute, second] = fullDateTimeMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        if (!isValid(date) || date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1) {
          throw new Error('Invalid European date');
        }
        return fromZonedTime(date, tz);
      }
      
      // Check for DD/MM/YYYY HH:mm format
      const dateTimeMatch = textStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
      if (dateTimeMatch) {
        const [, day, month, year, hour, minute] = dateTimeMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        if (!isValid(date) || date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1) {
          throw new Error('Invalid European date');
        }
        return fromZonedTime(date, tz);
      }
      
      // Check for DD/MM/YYYY format
      const dateMatch = textStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isValid(date) || date.getDate() !== parseInt(day) || date.getMonth() !== parseInt(month) - 1) {
          throw new Error('Invalid European date');
        }
        return fromZonedTime(date, tz);
      }
      
      // Reject all other formats
      throw new Error('Date must be in DD/MM/YYYY format');
    } catch {
      return null;
    }
  }

  private datetimeFormat(date: any, formatStr: any, timezone?: any): string | null {
    if (this.isBlank(date)) return null;
    try {
      const dateObj = this.toDate(date);
      const format = this.toString(formatStr);
      
      if (timezone) {
        const tz = this.toString(timezone);
        return formatTz(dateObj, format, { timeZone: tz });
      }
      
      // Default to Europe/London for UK format
      return formatTz(dateObj, format, { timeZone: 'Europe/London' });
    } catch {
      return null;
    }
  }

  private setTimezone(date: any, timezone: any): Date | null {
    if (this.isBlank(date)) return null;
    try {
      const dateObj = this.toDate(date);
      const tz = this.toString(timezone);
      return toZonedTime(dateObj, tz);
    } catch {
      return null;
    }
  }

  private dateAdd(date: any, quantity: any, unit: any): Date | null {
    console.log('dateAdd called with:', { date, quantity, unit });
    
    if (this.isBlank(date) || this.isBlank(quantity) || this.isBlank(unit)) {
      console.log('dateAdd: One or more parameters is blank');
      return null;
    }
    
    try {
      const dateObj = this.toDate(date);
      const qty = this.toNumber(quantity);
      const unitStr = this.toString(unit).toLowerCase();
      
      console.log('dateAdd processing:', { dateObj, qty, unitStr });
      
      let result;
      switch (unitStr) {
        case 'years': result = addYears(dateObj, qty); break;
        case 'months': result = addMonths(dateObj, qty); break;
        case 'weeks': result = addWeeks(dateObj, qty); break;
        case 'days': result = addDays(dateObj, qty); break;
        case 'hours': result = addHours(dateObj, qty); break;
        case 'minutes': result = addMinutes(dateObj, qty); break;
        case 'seconds': result = addSeconds(dateObj, qty); break;
        default: 
          console.error(`Unknown unit: ${unitStr}`);
          throw new Error(`Unknown unit: ${unitStr}`);
      }
      
      console.log('dateAdd result:', result);
      return result;
    } catch (error) {
      console.error('dateAdd error:', error);
      return null;
    }
  }

  private datetimeDiff(date1: any, date2: any, unit: any, absolute?: any): number | null {
    if (this.isBlank(date1) || this.isBlank(date2) || this.isBlank(unit)) return null;
    try {
      const d1 = this.toDate(date1);
      const d2 = this.toDate(date2);
      const unitStr = this.toString(unit).toLowerCase();
      const isAbsolute = this.toBool(absolute);
      
      let diff: number;
      switch (unitStr) {
        case 'years': diff = differenceInYears(d1, d2); break;
        case 'months': diff = differenceInMonths(d1, d2); break;
        case 'weeks': diff = differenceInWeeks(d1, d2); break;
        case 'days': diff = differenceInDays(d1, d2); break;
        case 'hours': diff = differenceInHours(d1, d2); break;
        case 'minutes': diff = differenceInMinutes(d1, d2); break;
        case 'seconds': diff = differenceInSeconds(d1, d2); break;
        default: throw new Error(`Unknown unit: ${unitStr}`);
      }
      
      return isAbsolute ? Math.abs(diff) : diff;
    } catch {
      return null;
    }
  }

  private workday(startDate: any, days: any): Date | null {
    if (this.isBlank(startDate) || this.isBlank(days)) return null;
    try {
      let current = this.toDate(startDate);
      let remaining = this.toNumber(days);
      
      while (remaining > 0) {
        current = addDays(current, 1);
        if (!isWeekend(current)) {
          remaining--;
        }
      }
      
      return current;
    } catch {
      return null;
    }
  }

  private workdayDiff(startDate: any, endDate: any): number | null {
    if (this.isBlank(startDate) || this.isBlank(endDate)) return null;
    try {
      const start = this.toDate(startDate);
      const end = this.toDate(endDate);
      let current = start;
      let count = 0;
      
      while (current < end) {
        if (!isWeekend(current)) {
          count++;
        }
        current = addDays(current, 1);
      }
      
      return count;
    } catch {
      return null;
    }
  }

  // Text function implementations
  private left(text: any, n: any): string | null {
    if (this.isBlank(text)) return null;
    const str = this.toString(text);
    const num = this.toNumber(n);
    return str.substring(0, Math.max(0, num));
  }

  private right(text: any, n: any): string | null {
    if (this.isBlank(text)) return null;
    const str = this.toString(text);
    const num = this.toNumber(n);
    return str.substring(Math.max(0, str.length - num));
  }

  private mid(text: any, start: any, n: any): string | null {
    if (this.isBlank(text)) return null;
    const str = this.toString(text);
    const startNum = Math.max(1, this.toNumber(start)) - 1; // Convert to 0-based
    const lengthNum = this.toNumber(n);
    return str.substring(startNum, startNum + lengthNum);
  }

  private proper(text: string): string {
    return text.replace(/\b\w/g, l => l.toUpperCase());
  }

  private find(substr: any, text: any, start?: any): number | null {
    if (this.isBlank(substr) || this.isBlank(text)) return null;
    const subStr = this.toString(substr);
    const textStr = this.toString(text);
    const startNum = start ? Math.max(1, this.toNumber(start)) - 1 : 0; // Convert to 0-based
    const index = textStr.indexOf(subStr, startNum);
    return index === -1 ? null : index + 1; // Convert back to 1-based
  }

  private substitute(text: any, old: any, replacement: any): string | null {
    if (this.isBlank(text)) return null;
    const textStr = this.toString(text);
    const oldStr = this.toString(old);
    const newStr = this.toString(replacement);
    return textStr.replace(new RegExp(oldStr, 'g'), newStr);
  }

  private regexMatch(text: any, pattern: any): boolean {
    if (this.isBlank(text) || this.isBlank(pattern)) return false;
    try {
      const regex = new RegExp(this.toString(pattern));
      return regex.test(this.toString(text));
    } catch {
      return false;
    }
  }

  private regexExtract(text: any, pattern: any): string | null {
    if (this.isBlank(text) || this.isBlank(pattern)) return null;
    try {
      const regex = new RegExp(this.toString(pattern));
      const match = this.toString(text).match(regex);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  }

  private regexReplace(text: any, pattern: any, replacement: any): string | null {
    if (this.isBlank(text)) return null;
    try {
      const regex = new RegExp(this.toString(pattern), 'g');
      return this.toString(text).replace(regex, this.toString(replacement));
    } catch {
      return null;
    }
  }

  // Number function implementations
  private round(num: any, precision?: any): number | null {
    if (this.isBlank(num)) return null;
    const n = this.toNumber(num);
    const p = precision ? this.toNumber(precision) : 0;
    return Math.round(n * Math.pow(10, p)) / Math.pow(10, p);
  }

  private roundUp(num: any, precision?: any): number | null {
    if (this.isBlank(num)) return null;
    const n = this.toNumber(num);
    const p = precision ? this.toNumber(precision) : 0;
    return Math.ceil(n * Math.pow(10, p)) / Math.pow(10, p);
  }

  private roundDown(num: any, precision?: any): number | null {
    if (this.isBlank(num)) return null;
    const n = this.toNumber(num);
    const p = precision ? this.toNumber(precision) : 0;
    return Math.floor(n * Math.pow(10, p)) / Math.pow(10, p);
  }

  private value(text: any): number | null {
    if (this.isBlank(text)) return null;
    const str = this.toString(text);
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  private mod(a: any, b: any): number | null {
    if (this.isBlank(a) || this.isBlank(b)) return null;
    const numA = this.toNumber(a);
    const numB = this.toNumber(b);
    if (numB === 0) throw new Error('Division by zero in MOD');
    return numA % numB;
  }

  // Array function implementations
  private arrayJoin(array: any, delimiter?: any): string | null {
    if (this.isBlank(array)) return null;
    if (!Array.isArray(array)) return this.toString(array);
    const delim = delimiter ? this.toString(delimiter) : ', ';
    return array.map(item => this.toString(item)).join(delim);
  }

  private arrayUnique(array: any): FormulaValue[] | null {
    if (this.isBlank(array)) return null;
    if (!Array.isArray(array)) return [array];
    return [...new Set(array)];
  }

  private arrayCompact(array: any): FormulaValue[] | null {
    if (this.isBlank(array)) return null;
    if (!Array.isArray(array)) return this.isBlank(array) ? [] : [array];
    return array.filter(item => !this.isBlank(item));
  }

  // Aggregate function implementations
  private sum(args: FormulaValue[]): number | null {
    const numbers = args.filter(arg => !this.isBlank(arg)).map(arg => this.toNumber(arg));
    return numbers.length === 0 ? null : numbers.reduce((sum, n) => sum + n, 0);
  }

  private max(args: FormulaValue[]): number | null {
    const numbers = args.filter(arg => !this.isBlank(arg) && typeof arg === 'number');
    return numbers.length === 0 ? null : Math.max(...numbers as number[]);
  }

  private min(args: FormulaValue[]): number | null {
    const numbers = args.filter(arg => !this.isBlank(arg) && typeof arg === 'number');
    return numbers.length === 0 ? null : Math.min(...numbers as number[]);
  }

  private average(args: FormulaValue[]): number | null {
    const numbers = args.filter(arg => !this.isBlank(arg)).map(arg => this.toNumber(arg));
    return numbers.length === 0 ? null : numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private count(args: FormulaValue[]): number {
    return args.filter(arg => !this.isBlank(arg) && typeof arg === 'number').length;
  }

  private countA(args: FormulaValue[]): number {
    return args.filter(arg => !this.isBlank(arg)).length;
  }
}

// Main evaluation function
export function evaluateFormula(
  formula: string, 
  recordData: Record<string, any>, 
  allRecords: Array<Record<string, any>>, 
  fieldNames: Record<string, string>
): FormulaValue {
  try {
    console.log('evaluateFormula called with:', {
      formula,
      recordData,
      fieldNames,
      allRecordsLength: allRecords.length
    });
    
    const parser = new FormulaParser();
    const ast = parser.parse(formula);
    console.log('Parsed AST:', ast);
    
    const evaluator = new FormulaEvaluator({
      recordData,
      allRecords,
      fieldNames
    });
    
    const result = evaluator.evaluate(ast);
    console.log('Final evaluation result:', result);
    return result;
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return '#ERROR!';
  }
}

// Format the result for display
export function formatFormulaResult(value: FormulaValue, format?: any): string {
  if (value === '#ERROR!') return '#ERROR!';
  if (value === null || value === undefined) return '';
  
  if (Array.isArray(value)) {
    return value.map(item => formatFormulaResult(item, format)).join(', ');
  }
  
  if (value instanceof Date) {
    // Default UK format
    return format ? 
      formatTz(value, format, { timeZone: 'Europe/London' }) :
      formatTz(value, 'dd/MM/yyyy', { timeZone: 'Europe/London' });
  }
  
  if (typeof value === 'number') {
    if (format?.type === 'currency') {
      return new Intl.NumberFormat('en-GB', { 
        style: 'currency', 
        currency: 'GBP',
        minimumFractionDigits: format.precision || 2
      }).format(value);
    }
    if (format?.type === 'percent') {
      return new Intl.NumberFormat('en-GB', { 
        style: 'percent',
        minimumFractionDigits: format.precision || 2
      }).format(value / 100);
    }
    if (format?.precision !== undefined) {
      return value.toFixed(format.precision);
    }
  }
  
  return String(value);
}