import { useState, useEffect, useRef } from "react";
import { CalendarIcon, FileText, Plus, Minus } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { format, addDays, addWeeks, addMonths, addYears, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";

export interface DocumentData {
  id: string;
  documentName: string;
  documentOwner: string;
  category: string;
  lastReviewDate: Date | null;
  reviewFrequency: string;
  reviewFrequencyNumber: string;
  reviewFrequencyPeriod: string;
  nextReviewDate: Date | null;
}

interface KeyDocumentTrackerProps {
  documents?: DocumentData[];
  onDocumentsChange?: (documents: DocumentData[]) => void;
  attendees?: Array<{ id: string; name: string; email?: string; attended?: boolean }>;
  onActionCreated?: (action: { itemTitle: string; mentionedAttendee: string; comment: string; action: string; dueDate: string; }) => void;
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

const periods = ["days", "weeks", "months", "years"];
const numbers = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

export const KeyDocumentTracker = ({
  documents = [],
  onDocumentsChange,
  attendees = [],
  onActionCreated
}: KeyDocumentTrackerProps) => {
  
  // Track which documents have had actions created to prevent duplicates
  const createdActionsRef = useRef<Set<string>>(new Set());
  
  const calculateNextReviewDate = (lastReviewDate: Date | null, number: string, period: string): Date | null => {
    if (!lastReviewDate || !number || !period) return null;
    
    const num = parseInt(number) || 1;
    
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

  const getDaysRemaining = (nextReviewDate: Date | null) => {
    if (!nextReviewDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reviewDate = new Date(nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    return differenceInDays(reviewDate, today);
  };

  const getDocumentColorClass = (nextReviewDate: Date | null) => {
    const daysRemaining = getDaysRemaining(nextReviewDate);
    if (daysRemaining === null) return "bg-white";
    
    if (daysRemaining < 0) {
      return "bg-red-50 border-red-200";
    } else if (daysRemaining <= 5) {
      return "bg-amber-50 border-amber-200";
    } else {
      return "bg-green-50 border-green-200";
    }
  };

  const handleDocumentChange = (index: number, field: keyof DocumentData, value: any) => {
    const updatedDocuments = [...documents];
    if (updatedDocuments[index]) {
      updatedDocuments[index] = {
        ...updatedDocuments[index],
        [field]: value
      };

      // Auto-calculate next review date when relevant fields change
      if (field === 'lastReviewDate' || field === 'reviewFrequencyNumber' || field === 'reviewFrequencyPeriod') {
        const doc = updatedDocuments[index];
        updatedDocuments[index].nextReviewDate = calculateNextReviewDate(
          doc.lastReviewDate, 
          doc.reviewFrequencyNumber, 
          doc.reviewFrequencyPeriod
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
      reviewFrequency: '',
      reviewFrequencyNumber: '',
      reviewFrequencyPeriod: '',
      nextReviewDate: null
    };
    const updatedDocuments = [...documents, newDocument];
    onDocumentsChange?.(updatedDocuments);
  };

  const removeDocument = (docId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== docId);
    onDocumentsChange?.(updatedDocuments);
  };

  // Check for documents due within 30 days and create actions
  useEffect(() => {
    if (!onActionCreated || documents.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    documents.forEach(doc => {
      if (doc.nextReviewDate && doc.documentName && doc.documentOwner) {
        const dueDate = new Date(doc.nextReviewDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // Create a unique key for this document's action
        const actionKey = `${doc.id}-${doc.nextReviewDate.getTime()}`;
        
        // Check if document is due within 30 days and hasn't already had an action created
        if (dueDate >= today && dueDate <= thirtyDaysFromNow && !createdActionsRef.current.has(actionKey)) {
          const action = {
            itemTitle: "Key Document Review",
            mentionedAttendee: doc.documentOwner,
            comment: "Document review scheduled",
            action: `Review due for '${doc.documentName}' by ${format(doc.nextReviewDate, "PPP")}`,
            dueDate: format(doc.nextReviewDate, "PPP")
          };
          
          onActionCreated(action);
          
          // Mark this action as created to prevent duplicates
          createdActionsRef.current.add(actionKey);
        }
      }
    });
  }, [documents, onActionCreated]);

  // Group documents by category
  const groupedDocuments = categories.map(category => {
    const categoryDocs = documents.filter(doc => doc.category === category);
    return [category, categoryDocs] as [string, DocumentData[]];
  }).filter(([, docs]) => docs.length > 0);

  // Add uncategorized documents
  const uncategorizedDocs = documents.filter(doc => !doc.category || !categories.includes(doc.category));
  if (uncategorizedDocs.length > 0) {
    groupedDocuments.push(["Uncategorized", uncategorizedDocs]);
  }

  return (
    <Card className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-foreground">Key Review Dates</h3>
      </div>
      
      <div className="space-y-6">
        {groupedDocuments.map(([category, docs]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-medium text-foreground border-b border-border/20 pb-2">
              {category}
            </h4>
            {docs.map((doc) => (
              <div key={doc.id} className={`grid grid-cols-12 gap-3 p-4 border rounded-lg items-start ${getDocumentColorClass(doc.nextReviewDate)}`}>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <Select value={doc.category} onValueChange={(value) => handleDocumentChange(documents.indexOf(doc), 'category', value)}>
                    <SelectTrigger className="text-sm h-9 bg-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-sm">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Document Name</label>
                  <Input 
                    value={doc.documentName} 
                    onChange={e => handleDocumentChange(documents.indexOf(doc), 'documentName', e.target.value)} 
                    placeholder="Enter document name" 
                    className="text-sm h-9" 
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Document Owner</label>
                  <Select value={doc.documentOwner} onValueChange={(value) => handleDocumentChange(documents.indexOf(doc), 'documentOwner', value)}>
                    <SelectTrigger className="text-sm h-9 bg-white">
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {attendees.map((attendee) => (
                        <SelectItem key={attendee.id} value={attendee.name} className="text-sm">
                          {attendee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Reviewed</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-9 p-0">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={doc.lastReviewDate || undefined} 
                        onSelect={date => handleDocumentChange(documents.indexOf(doc), 'lastReviewDate', date || null)} 
                        initialFocus 
                        className="p-3 pointer-events-auto bg-white" 
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
                  <div className="flex gap-1">
                    <Select value={doc.reviewFrequencyNumber} onValueChange={(value) => handleDocumentChange(documents.indexOf(doc), 'reviewFrequencyNumber', value)}>
                      <SelectTrigger className="text-sm h-9 w-16">
                        <SelectValue placeholder="#" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {numbers.map((num) => (
                          <SelectItem key={num} value={num} className="text-sm">
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={doc.reviewFrequencyPeriod} onValueChange={(value) => handleDocumentChange(documents.indexOf(doc), 'reviewFrequencyPeriod', value)}>
                      <SelectTrigger className="text-sm h-9 flex-1">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {periods.map((period) => (
                          <SelectItem key={period} value={period} className="text-sm">
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                  <div className="text-sm p-2 bg-muted/50 rounded border text-center h-9 flex items-center justify-center">
                    {doc.nextReviewDate ? format(doc.nextReviewDate, "PPP") : ""}
                  </div>
                </div>
                
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block opacity-0">Remove</label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeDocument(doc.id)} 
                    className="text-xs text-destructive hover:text-destructive w-full h-9 p-0"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {documents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No documents tracked yet.</p>
          </div>
        )}
        
        <Button variant="outline" onClick={addDocument} className="w-full text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>
    </Card>
  );
};