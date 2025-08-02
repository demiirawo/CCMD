import { useState, useEffect } from "react";
import { CalendarIcon, FileText, Plus, Minus, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { format, addDays, addWeeks, addMonths, addYears, differenceInDays } from "date-fns";
import { Card } from "./ui/card";
import { StatusBadge, StatusType } from "./StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
  updatedAt?: string;
}

interface KeyDocumentTrackerProps {
  documents?: DocumentData[];
  onDocumentsChange?: (documents: DocumentData[]) => void;
  attendees?: string[];
  forceOpen?: boolean;
  onPanelStateChange?: () => void;
  panelStateTracker?: number;
  readOnly?: boolean;
}

const categories = ["Governance and Compliance", "Care Delivery", "Staffing and HR", "Finance and Payroll", "Health and Safety", "Client Records and Contracts", "Quality Assurance and Audit", "Transportation and Logistics"];
const periods = ["days", "weeks", "months", "years"];
const numbers = Array.from({
  length: 12
}, (_, i) => (i + 1).toString());

export const KeyDocumentTracker = ({
  documents = [],
  onDocumentsChange,
  attendees = [],
  forceOpen,
  onPanelStateChange,
  panelStateTracker,
  readOnly = false
}: KeyDocumentTrackerProps) => {
  const { companies, profile } = useAuth();
  const currentCompany = companies.find(c => c.id === profile?.company_id);
  const isDynamicPanelColourEnabled = (currentCompany as any)?.dynamic_panel_colour || false;
  
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = sessionStorage.getItem('key_documents_expanded');
    return saved !== null ? JSON.parse(saved) : false;
  });
  
  // Listen for panel state changes to sync with sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('key_documents_expanded');
    const savedState = saved !== null ? JSON.parse(saved) : false;
    if (savedState !== isExpanded) {
      setIsExpanded(savedState);
    }
  }, [panelStateTracker, isExpanded]);
  
  const isOpen = isExpanded;

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
    if (!nextReviewDate) return "bg-stone-50 text-black border-gray-300";
    const daysRemaining = getDaysRemaining(new Date(nextReviewDate));
    if (daysRemaining === null) return "bg-stone-50 text-black border-gray-300";
    if (daysRemaining < 0) {
      return "bg-stone-50 text-black border-gray-300";
    } else if (daysRemaining <= 5) {
      return "bg-stone-50 text-black border-gray-300";
    } else {
      return "bg-stone-50 text-black border-gray-300";
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
        [field]: value,
        updatedAt: new Date().toISOString()
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
      nextReviewDate: null,
      updatedAt: new Date().toISOString()
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

  // Function to get background class with dynamic panel colour support
  const getBackgroundClass = () => {
    if (isDynamicPanelColourEnabled) {
      const status = getOverallStatus();
      switch (status) {
        case 'green':
          return 'bg-status-green text-white';
        case 'amber':
          return 'bg-status-amber text-white';
        case 'red':
          return 'bg-status-red text-white';
        case 'na':
          return 'bg-status-na text-white';
        default:
          return 'bg-primary/10';
      }
    }
    return 'bg-primary/10';
  };

  return <div className={`rounded-2xl p-6 shadow-lg -mx-8 px-14 outline-none ${getBackgroundClass()}`}>
      <div className="flex items-center justify-between cursor-pointer mb-6 outline-none" onClick={() => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        sessionStorage.setItem('key_documents_expanded', JSON.stringify(newState));
        onPanelStateChange?.();
      }}>
        <div className="flex items-center gap-3">
          <div>
            <h3 className={cn(
              "text-xl font-bold",
              isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
            )}>Key Review Dates</h3>
            <p className={cn(
              "text-sm",
              isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
            )}>
              Updated: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
          <div className="ml-4">
            <StatusBadge status={getOverallStatus()} />
          </div>
        </div>
        <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors outline-none">
          {isOpen ? (
            <ChevronDown className={cn(
              "w-5 h-5",
              isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
            )} />
          ) : (
            <ChevronRight className={cn(
              "w-5 h-5", 
              isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
            )} />
          )}
        </div>
      </div>
      
      {isOpen && <div className="space-y-6">
        {groupedDocuments.map(([category, docs]) => <div key={category} className="space-y-3">
            <h4 className={cn(
              "text-sm font-medium border-b border-border/20 pb-2",
              isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
            )}>
              {category}
            </h4>
            {docs.map(doc => <div key={doc.id} className={`p-4 border rounded-lg space-y-3 ${getDocumentColorClass(doc.nextReviewDate)}`}>
                {/* First line: Category, Document Name, Document Owner */}
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-3">
                    <label className="text-xs text-gray-700 mb-1 block">Category</label>
                    <Select value={doc.category} onValueChange={value => handleDocumentChange(documents.indexOf(doc), 'category', value)}>
                      <SelectTrigger className="text-sm h-9 bg-white text-black">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {categories.map(cat => <SelectItem key={cat} value={cat} className="text-sm">
                            {cat}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-4">
                    <label className="text-xs text-gray-700 mb-1 block">Document Name</label>
                    <Input value={doc.name} onChange={e => handleDocumentChange(documents.indexOf(doc), 'name', e.target.value)} placeholder="Enter document name" className="text-sm h-9 bg-white text-black" />
                  </div>
                  
                  <div className="col-span-4">
                    <label className="text-xs text-gray-700 mb-1 block">Document Owner</label>
                    <Input 
                      value={doc.owner} 
                      onChange={e => handleDocumentChange(documents.indexOf(doc), 'owner', e.target.value)} 
                      placeholder="Enter document owner" 
                      className="text-sm h-9 bg-white text-black" 
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="text-xs text-gray-700 mb-1 block opacity-0">Remove</label>
                    <Button variant="outline" size="sm" onClick={() => removeDocument(doc.id)} className="text-xs text-white hover:text-white w-8 h-9 p-0 bg-white/20 border-white/30 hover:bg-white/30">
                      <Minus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Second line: Date, Frequency, Due */}
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-3">
                    <label className="text-xs text-gray-700 mb-1 block">Date</label>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 w-9 p-0 flex-shrink-0 bg-white text-black">
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={doc.lastReviewDate ? new Date(doc.lastReviewDate) : undefined} onSelect={date => handleDocumentChange(documents.indexOf(doc), 'lastReviewDate', date ? format(date, 'yyyy-MM-dd') : '')} initialFocus className="p-3 pointer-events-auto bg-white" />
                        </PopoverContent>
                      </Popover>
                      <span className="text-sm text-gray-700 w-20">
                        {doc.lastReviewDate ? new Date(doc.lastReviewDate).toLocaleDateString('en-GB') : ""}
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-span-4">
                    <label className="text-xs text-gray-700 mb-1 block">Frequency</label>
                    <div className="flex gap-1">
                      <Select value={doc.reviewFrequencyNumber} onValueChange={value => handleDocumentChange(documents.indexOf(doc), 'reviewFrequencyNumber', value)}>
                        <SelectTrigger className="text-sm h-9 w-16 bg-white text-black">
                          <SelectValue placeholder="#" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {numbers.map(num => <SelectItem key={num} value={num} className="text-sm">
                              {num}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={doc.reviewFrequencyPeriod} onValueChange={value => handleDocumentChange(documents.indexOf(doc), 'reviewFrequencyPeriod', value)}>
                        <SelectTrigger className="text-sm h-9 flex-1 bg-white text-black">
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
                  
                  <div className="col-span-4">
                    <label className="text-xs text-gray-700 mb-1 block">Due</label>
                    <div className={`text-sm p-2 rounded border text-center h-9 flex items-center justify-center ${
                      doc.nextReviewDate 
                        ? getDocumentStatus(doc.nextReviewDate) === 'red' 
                          ? 'status-red' 
                          : getDocumentStatus(doc.nextReviewDate) === 'amber' 
                          ? 'status-amber' 
                          : 'status-green'
                        : 'bg-white/20 border-white/30 text-gray-700'
                    }`}>
                      {doc.nextReviewDate ? (
                        <>
                          {new Date(doc.nextReviewDate).toLocaleDateString('en-GB')}
                          {(() => {
                            const daysRemaining = getDaysRemaining(new Date(doc.nextReviewDate));
                            if (daysRemaining !== null) {
                              return ` • ${Math.abs(daysRemaining)} day(s) ${daysRemaining < 0 ? 'overdue' : 'remaining'}`;
                            }
                            return '';
                          })()}
                        </>
                      ) : ""}
                    </div>
                  </div>

                  <div className="col-span-1">
                    {/* Empty space to align with remove button above */}
                  </div>
                </div>

              </div>)}
          </div>)}
        
        {documents.length === 0 && <div className="text-center py-8 text-muted-foreground">
            
            <p className="mb-4 text-white">No reviews tracked yet.</p>
          </div>}
        
        <Button variant="default" onClick={addDocument} className="w-full text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>}
    </div>;
};
