import { useState } from "react";
import { CalendarIcon, FileText, Plus } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
export interface DocumentData {
  id: string;
  documentName: string;
  documentOwner: string;
  lastReviewDate: Date | null;
  reviewFrequency: string;
  nextReviewDate: Date | null;
}
interface KeyDocumentTrackerProps {
  documents?: DocumentData[];
  onDocumentsChange?: (documents: DocumentData[]) => void;
}
export const KeyDocumentTracker = ({
  documents = [],
  onDocumentsChange
}: KeyDocumentTrackerProps) => {
  const calculateNextReviewDate = (lastReviewDate: Date | null, frequency: string): Date | null => {
    if (!lastReviewDate || !frequency) return null;
    const freq = frequency.toLowerCase();
    if (freq.includes('day')) {
      const days = parseInt(freq) || 1;
      return addDays(lastReviewDate, days);
    } else if (freq.includes('week')) {
      const weeks = parseInt(freq) || 1;
      return addWeeks(lastReviewDate, weeks);
    } else if (freq.includes('month')) {
      const months = parseInt(freq) || 1;
      return addMonths(lastReviewDate, months);
    } else if (freq.includes('year')) {
      const years = parseInt(freq) || 1;
      return addYears(lastReviewDate, years);
    }
    return null;
  };
  const handleDocumentChange = (index: number, field: keyof DocumentData, value: any) => {
    const updatedDocuments = [...documents];
    if (updatedDocuments[index]) {
      updatedDocuments[index] = {
        ...updatedDocuments[index],
        [field]: value
      };

      // Auto-calculate next review date when last review date or frequency changes
      if (field === 'lastReviewDate' || field === 'reviewFrequency') {
        updatedDocuments[index].nextReviewDate = calculateNextReviewDate(updatedDocuments[index].lastReviewDate, updatedDocuments[index].reviewFrequency);
      }
      onDocumentsChange?.(updatedDocuments);
    }
  };
  const addDocument = () => {
    const newDocument: DocumentData = {
      id: `doc-${Date.now()}`,
      documentName: '',
      documentOwner: '',
      lastReviewDate: null,
      reviewFrequency: '',
      nextReviewDate: null
    };
    const updatedDocuments = [...documents, newDocument];
    onDocumentsChange?.(updatedDocuments);
  };
  const removeDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);
    onDocumentsChange?.(updatedDocuments);
  };
  return <Card className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-foreground">Key Document Tracker</h3>
      </div>
      
      <div className="space-y-4">
        {documents.map((doc, index) => <div key={doc.id} className="grid grid-cols-5 gap-3 p-4 border border-border/20 rounded-lg bg-muted/20">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Document Name</label>
              <Input value={doc.documentName} onChange={e => handleDocumentChange(index, 'documentName', e.target.value)} placeholder="Enter document name" className="text-sm" />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Document Owner</label>
              <Input value={doc.documentOwner} onChange={e => handleDocumentChange(index, 'documentOwner', e.target.value)} placeholder="Enter owner name" className="text-sm" />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Last Review Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm h-9", !doc.lastReviewDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {doc.lastReviewDate ? format(doc.lastReviewDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={doc.lastReviewDate || undefined} onSelect={date => handleDocumentChange(index, 'lastReviewDate', date || null)} initialFocus className="p-3 pointer-events-auto bg-white" />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Review Frequency</label>
              <Input value={doc.reviewFrequency} onChange={e => handleDocumentChange(index, 'reviewFrequency', e.target.value)} placeholder="e.g., 6 months" className="text-sm" />
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Next Review Date</label>
              <div className="text-sm p-2 bg-muted/50 rounded border text-center min-h-[36px] flex items-center justify-center">
                {doc.nextReviewDate ? format(doc.nextReviewDate, "PPP") : "Auto-calculated"}
              </div>
            </div>
            
            <div className="col-span-5 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => removeDocument(index)} className="text-xs text-destructive hover:text-destructive">
                Remove Document
              </Button>
            </div>
          </div>)}
        
        {documents.length === 0 && <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No documents tracked yet.</p>
          </div>}
        
        <Button variant="outline" onClick={addDocument} className="w-full text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>
    </Card>;
};