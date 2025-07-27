import { useState } from "react";
import { CalendarIcon, FileText, Plus, Minus, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { format, addDays, addWeeks, addMonths, addYears, differenceInDays } from "date-fns";
import { Card } from "./ui/card";
import { StatusBadge, StatusType } from "./StatusBadge";
export interface DocumentData {
  id: string;
  name: string;
  owner: string;
  category: string;
  lastReviewDate: string;
  reviewFrequency: string;
  reviewFrequencyNumber: string;
  reviewFrequencyPeriod: string;
  nextReviewDate: string | null;
}
interface KeyDocumentTrackerProps {
  documents?: DocumentData[];
  onDocumentsChange?: (documents: DocumentData[]) => void;
  attendees?: string[];
}
const categories = ["Governance and Compliance", "Care Delivery", "Staffing and HR", "Finance and Payroll", "Health and Safety", "Client Records and Contracts", "Quality Assurance and Audit", "Transportation and Logistics"];
const periods = ["days", "weeks", "months", "years"];
const numbers = Array.from({
  length: 12
}, (_, i) => (i + 1).toString());
export const KeyDocumentTracker = ({
  documents = [],
  onDocumentsChange,
  attendees = []
}: KeyDocumentTrackerProps) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = sessionStorage.getItem('key_documents_expanded');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const calculateNextReviewDate = (lastReviewDate: string | null, number: string, period: string): Date | null => {
    if (!lastReviewDate) return null;
    const lastDate = new Date(lastReviewDate);
    if (isNaN(lastDate.getTime())) return null;

    // If no frequency is specified, use the same date as the last review date
    if (!number || !period) return lastDate;
    const num = parseInt(number) || 1;
    switch (period) {
      case 'days':
        return addDays(lastDate, num);
      case 'weeks':
        return addWeeks(lastDate, num);
      case 'months':
        return addMonths(lastDate, num);
      case 'years':
        return addYears(lastDate, num);
      default:
        return lastDate;
    }
  };
  const getDaysRemaining = (nextReviewDate: Date | null) => {
    if (!nextReviewDate) return null;
    const today = new Date();
    const reviewDate = new Date(nextReviewDate);

    // Check if dates are valid
    if (isNaN(today.getTime()) || isNaN(reviewDate.getTime())) {
      console.warn('Invalid date in getDaysRemaining:', nextReviewDate);
      return null;
    }
    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);
    const diffDays = differenceInDays(reviewDate, today);
    return isNaN(diffDays) ? null : diffDays;
  };
  const getDocumentStatus = (nextReviewDate: string | null): StatusType => {
    if (!nextReviewDate) return "green";
    const daysRemaining = getDaysRemaining(new Date(nextReviewDate));
    if (daysRemaining === null) return "green";
    if (daysRemaining < 0) {
      return "red"; // Overdue
    } else if (daysRemaining <= 5) {
      return "amber"; // Due within 5 days
    } else {
      return "green"; // More than 5 days
    }
  };
  const getDocumentColorClass = (nextReviewDate: string | null) => {
    if (!nextReviewDate) return "bg-white";
    const daysRemaining = getDaysRemaining(new Date(nextReviewDate));
    if (daysRemaining === null) return "bg-white";
    if (daysRemaining < 0) {
      return "bg-red-50 border-red-200";
    } else if (daysRemaining <= 5) {
      return "bg-amber-50 border-amber-200";
    } else {
      return "bg-green-50 border-green-200";
    }
  };

  // Calculate overall status for the section
  const getOverallStatus = (): StatusType => {
    if (documents.length === 0) return "green";
    const statuses = documents.filter(doc => doc.name && doc.lastReviewDate) // Only consider documents with name and date
    .map(doc => getDocumentStatus(doc.nextReviewDate));
    if (statuses.some(status => status === "red")) return "red";
    if (statuses.some(status => status === "amber")) return "amber";
    return "green";
  };
  const handleDocumentChange = (index: number, field: keyof DocumentData, value: any) => {
    const updatedDocuments = [...documents];
    if (updatedDocuments[index]) {
      const oldDoc = updatedDocuments[index];
      updatedDocuments[index] = {
        ...oldDoc,
        [field]: value
      };

      // Auto-calculate next review date when relevant fields change
      if (field === 'lastReviewDate' || field === 'reviewFrequencyNumber' || field === 'reviewFrequencyPeriod') {
        const doc = updatedDocuments[index];
        const nextReview = calculateNextReviewDate(doc.lastReviewDate, doc.reviewFrequencyNumber, doc.reviewFrequencyPeriod);
        updatedDocuments[index].nextReviewDate = nextReview ? format(nextReview, 'yyyy-MM-dd') : null;
      }
      onDocumentsChange?.(updatedDocuments);
    }
  };
  const addDocument = () => {
    const newDocument: DocumentData = {
      id: `doc-${Date.now()}`,
      name: '',
      owner: '',
      category: '',
      lastReviewDate: '',
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
  return <Card className="bg-white rounded-2xl p-6 shadow-lg border border-border/50">
      <div className="flex items-center justify-between cursor-pointer mb-6" onClick={() => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        sessionStorage.setItem('key_documents_expanded', JSON.stringify(newState));
      }}>
        <div className="flex items-center gap-3">
          
          <h3 className="text-xl font-bold text-foreground">Key Review Dates</h3>
          <div className="ml-4">
            <StatusBadge status={getOverallStatus()} />
          </div>
        </div>
        <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors">
          {isExpanded ? 
            <ChevronDown className="w-5 h-5 text-muted-foreground" /> : 
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          }
        </div>
      </div>
      
      {isExpanded && <div className="space-y-6">
        {groupedDocuments.map(([category, docs]) => <div key={category} className="space-y-3">
            <h4 className="text-sm font-medium text-foreground border-b border-border/20 pb-2">
              {category}
            </h4>
            {docs.map(doc => <div key={doc.id} className={`grid grid-cols-12 gap-3 p-4 border rounded-lg items-start ${getDocumentColorClass(doc.nextReviewDate)}`}>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <Select value={doc.category} onValueChange={value => handleDocumentChange(documents.indexOf(doc), 'category', value)}>
                    <SelectTrigger className="text-sm h-9 bg-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {categories.map(cat => <SelectItem key={cat} value={cat} className="text-sm">
                          {cat}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                 <div className="col-span-2">
                   <label className="text-xs text-muted-foreground mb-1 block">Document Name</label>
                   <Input value={doc.name} onChange={e => handleDocumentChange(documents.indexOf(doc), 'name', e.target.value)} placeholder="Enter document name" className="text-sm h-9" />
                 </div>
                
                 <div className="col-span-2">
                   <label className="text-xs text-muted-foreground mb-1 block">Document Owner</label>
                   <Select value={doc.owner} onValueChange={value => handleDocumentChange(documents.indexOf(doc), 'owner', value)}>
                     <SelectTrigger className="text-sm h-9 bg-white">
                       <SelectValue placeholder="Select owner" />
                     </SelectTrigger>
                     <SelectContent className="bg-white">
                       {attendees.map(attendee => <SelectItem key={attendee} value={attendee} className="text-sm">
                           {attendee}
                         </SelectItem>)}
                     </SelectContent>
                   </Select>
                 </div>
                
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 w-9 p-0 flex-shrink-0">
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                         <Calendar mode="single" selected={doc.lastReviewDate ? new Date(doc.lastReviewDate) : undefined} onSelect={date => handleDocumentChange(documents.indexOf(doc), 'lastReviewDate', date ? format(date, 'yyyy-MM-dd') : '')} initialFocus className="p-3 pointer-events-auto bg-white" />
                      </PopoverContent>
                    </Popover>
                    <span className="text-sm text-foreground w-20">
                      {doc.lastReviewDate ? new Date(doc.lastReviewDate).toLocaleDateString('en-GB') : ""}
                    </span>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
                  <div className="flex gap-1">
                    <Select value={doc.reviewFrequencyNumber} onValueChange={value => handleDocumentChange(documents.indexOf(doc), 'reviewFrequencyNumber', value)}>
                      <SelectTrigger className="text-sm h-9 w-16">
                        <SelectValue placeholder="#" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {numbers.map(num => <SelectItem key={num} value={num} className="text-sm">
                            {num}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={doc.reviewFrequencyPeriod} onValueChange={value => handleDocumentChange(documents.indexOf(doc), 'reviewFrequencyPeriod', value)}>
                      <SelectTrigger className="text-sm h-9 flex-1">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {periods.map(period => <SelectItem key={period} value={period} className="text-sm">
                            {period}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                 <div className="col-span-2">
                   <label className="text-xs text-muted-foreground mb-1 block">Due</label>
                   <div className="text-sm p-2 bg-muted/50 rounded border text-center h-9 flex items-center justify-center">
                     {doc.nextReviewDate ? new Date(doc.nextReviewDate).toLocaleDateString('en-GB') : ""}
                   </div>
                 </div>
                
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block opacity-0">Remove</label>
                  <Button variant="outline" size="sm" onClick={() => removeDocument(doc.id)} className="text-xs text-destructive hover:text-destructive w-8 h-9 p-0">
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              </div>)}
          </div>)}
        
        {documents.length === 0 && <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No documents tracked yet.</p>
          </div>}
        
        <Button variant="default" onClick={addDocument} className="w-full text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>}
    </Card>;
};