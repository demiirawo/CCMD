import { useState } from "react";
import { CalendarIcon, FileText, Plus, Minus } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";

export interface DocumentData {
  id: string;
  documentName: string;
  documentOwner: string;
  category: string;
  lastReviewDate: Date | null;
  reviewFrequencyNumber: string;
  reviewFrequencyPeriod: string;
  nextReviewDate: Date | null;
}

interface KeyDocumentTrackerProps {
  documents?: DocumentData[];
  onDocumentsChange?: (documents: DocumentData[]) => void;
}

const categories = [
  "Governance and Compliance",
  "Care Delivery",
  "Staffing and HR",
  "Finance and Payroll",
  "Health and Safety",
  "Client Records and Contracts",
  "Quality Assurance and Audit",
  "Transportation and Logistics"
];

const numbers = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const periods = ["days", "weeks", "months", "years"];

export const KeyDocumentTracker = ({
  documents = [],
  onDocumentsChange
}: KeyDocumentTrackerProps) => {
  const calculateNextReviewDate = (lastReviewDate: Date | null, number: string, period: string): Date | null => {
    if (!lastReviewDate || !number || !period) return null;
    
    const num = parseInt(number);
    if (isNaN(num)) return null;
    
    switch (period) {
      case 'days':
        return addDays(lastReviewDate, num);
      case 'weeks':
        return addWeeks(lastReviewDate, num);
      case 'months':
        return addMonths(lastReviewDate, num);
      case 'years':
        return addYears(lastReviewDate, num);
      default:
        return null;
    }
  };

  const handleDocumentChange = (index: number, field: keyof DocumentData, value: any) => {
    const updatedDocuments = [...documents];
    if (updatedDocuments[index]) {
      updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
      
      // Auto-calculate next review date when relevant fields change
      if (field === 'lastReviewDate' || field === 'reviewFrequencyNumber' || field === 'reviewFrequencyPeriod') {
        updatedDocuments[index].nextReviewDate = calculateNextReviewDate(
          updatedDocuments[index].lastReviewDate,
          updatedDocuments[index].reviewFrequencyNumber,
          updatedDocuments[index].reviewFrequencyPeriod
        );
      }
      
      onDocumentsChange?.(updatedDocuments);
    }
  };

  const addDocument = () => {
    const newDocument: DocumentData = {
      id: `doc-${Date.now()}`,
      documentName: '',
      documentOwner: '',
      category: '',
      lastReviewDate: null,
      reviewFrequencyNumber: '',
      reviewFrequencyPeriod: '',
      nextReviewDate: null
    };
    const updatedDocuments = [...documents, newDocument];
    onDocumentsChange?.(updatedDocuments);
  };

  const removeDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);
    onDocumentsChange?.(updatedDocuments);
  };

  // Group documents by category
  const groupedDocuments = documents.reduce((groups, doc) => {
    const category = doc.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(doc);
    return groups;
  }, {} as Record<string, DocumentData[]>);

  return (
    <Card className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-foreground">Key Document Tracker</h3>
      </div>
      
      <div className="space-y-6">
        {Object.entries(groupedDocuments).map(([category, docs]) => (
          <div key={category} className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b border-border/20 pb-2">
              {category}
            </h4>
            {docs.map((doc, globalIndex) => {
              const documentIndex = documents.findIndex(d => d.id === doc.id);
              return (
                <div key={doc.id} className="grid grid-cols-6 gap-3 p-4 border border-border/20 rounded-lg bg-muted/20">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Document Name</label>
                    <Input
                      value={doc.documentName}
                      onChange={(e) => handleDocumentChange(documentIndex, 'documentName', e.target.value)}
                      placeholder="Enter document name"
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Document Owner</label>
                    <Input
                      value={doc.documentOwner}
                      onChange={(e) => handleDocumentChange(documentIndex, 'documentOwner', e.target.value)}
                      placeholder="Enter owner name"
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <Select
                      value={doc.category}
                      onValueChange={(value) => handleDocumentChange(documentIndex, 'category', value)}
                    >
                      <SelectTrigger className="text-sm h-9 bg-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Last Review Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm h-9",
                            !doc.lastReviewDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {doc.lastReviewDate ? format(doc.lastReviewDate, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={doc.lastReviewDate || undefined}
                          onSelect={(date) => handleDocumentChange(documentIndex, 'lastReviewDate', date || null)}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Review Frequency</label>
                    <div className="flex gap-1">
                      <Select
                        value={doc.reviewFrequencyNumber}
                        onValueChange={(value) => handleDocumentChange(documentIndex, 'reviewFrequencyNumber', value)}
                      >
                        <SelectTrigger className="text-sm h-9 w-16">
                          <SelectValue placeholder="#" />
                        </SelectTrigger>
                        <SelectContent>
                          {numbers.map((num) => (
                            <SelectItem key={num} value={num}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={doc.reviewFrequencyPeriod}
                        onValueChange={(value) => handleDocumentChange(documentIndex, 'reviewFrequencyPeriod', value)}
                      >
                        <SelectTrigger className="text-sm h-9 flex-1">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          {periods.map((period) => (
                            <SelectItem key={period} value={period}>{period}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Next Review Date</label>
                    <div className="text-sm p-2 bg-muted/50 rounded border text-center min-h-[36px] flex items-center justify-center">
                      {doc.nextReviewDate ? format(doc.nextReviewDate, "PPP") : "Auto-calculated"}
                    </div>
                  </div>
                  
                  <div className="col-span-6 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDocument(documentIndex)}
                      className="text-xs text-destructive hover:text-destructive w-8 h-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {documents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No documents tracked yet.</p>
          </div>
        )}
        
        <Button
          variant="outline"
          onClick={addDocument}
          className="w-full text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>
    </Card>
  );
};