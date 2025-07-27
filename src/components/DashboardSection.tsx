import { StatusItem, StatusItemData } from "./StatusItem";
import { StatusType, StatusBadge } from "./StatusBadge";
import { CapacityAnalytics } from "./CapacityAnalytics";
import { SubsectionMetadata } from "./SubsectionMetadataDialog";
import { ChevronDown, ChevronRight, Plus, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useState } from "react";

interface DashboardSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: StatusItemData[];
  onItemStatusChange?: (id: string, status: StatusType) => void;
  onItemObservationChange?: (id: string, observation: string) => void;
  onItemActionsChange?: (id: string, actions: import("./ActionForm").ActionItem[]) => void;
  onItemDocumentsChange?: (id: string, documents: import("./StatusItem").DocumentData[]) => void;
  onItemMetadataChange?: (id: string, metadata: SubsectionMetadata) => void;
  onAddItem?: (sectionTitle: string) => void;
  onActionCreated?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string, subsectionActionId?: string) => void;
  onSubsectionActionEdit?: (sectionId: string, actionId: string, updates: { comment?: string; dueDate?: string }) => void;
  attendees?: string[];
  defaultOpen?: boolean;
  meetingDate?: Date;
  meetingId?: string;
}

export const DashboardSection = ({
  title,
  icon,
  items,
  onItemStatusChange,
  onItemObservationChange,
  onItemActionsChange,
  onItemDocumentsChange,
  onItemMetadataChange,
  onAddItem,
  onActionCreated,
  onSubsectionActionEdit,
  attendees = [],
  defaultOpen = true,
  meetingDate,
  meetingId
}: DashboardSectionProps) => {
  const [isOpen, setIsOpen] = useState(() => {
    const storageKey = `section_${title.replace(/\s+/g, '_').toLowerCase()}_open`;
    const saved = sessionStorage.getItem(storageKey);
    return saved !== null ? JSON.parse(saved) : defaultOpen;
  });
  const [monthlyStaffData, setMonthlyStaffData] = useState<Array<{month: string, currentStaff: number, probationStaff?: number}>>([]);

  const statusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<StatusType, number>);

  const getOverallStatus = () => {
    // Filter out N/A items from overall status calculation
    const applicableItems = items.filter(item => item.status !== 'na');
    if (applicableItems.length === 0) return 'green'; // Default if all are N/A
    
    const applicableCounts = applicableItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<StatusType, number>);
    
    if (applicableCounts.red > 0) return 'red';
    if (applicableCounts.amber > 0) return 'amber';
    return 'green';
  };

  const getLastUpdated = () => {
    if (items.length === 0) return null;
    
    // Find the most recent lastReviewed date from all items
    const dates = items
      .map(item => item.lastReviewed)
      .filter(date => date && date.trim() !== '')
      .sort((a, b) => {
        // Convert dates to comparable format (handle different formats)
        const parseDate = (dateStr: string) => {
          // Handle formats like "24-Jul-25" or "24/07/2025"
          if (dateStr.includes('-')) {
            const [day, month, year] = dateStr.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.indexOf(month);
            if (monthIndex !== -1) {
              const fullYear = year.length === 2 ? `20${year}` : year;
              return new Date(parseInt(fullYear), monthIndex, parseInt(day));
            }
          }
          // Try parsing as is
          return new Date(dateStr);
        };
        
        const dateA = parseDate(a);
        const dateB = parseDate(b);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
    
    if (dates.length === 0) return null;
    
    // Format the date to only show date without time
    const latestDate = dates[0];
    // If it's already in a simple format like "24-Jul-25", return as is
    if (latestDate.includes('-') && latestDate.split('-').length === 3) {
      return latestDate;
    }
    
    // Otherwise, parse and format to a clean date
    const parseDate = (dateStr: string) => {
      if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(month);
        if (monthIndex !== -1) {
          const fullYear = year.length === 2 ? `20${year}` : year;
          return new Date(parseInt(fullYear), monthIndex, parseInt(day));
        }
      }
      return new Date(dateStr);
    };
    
    const parsedDate = parseDate(latestDate);
    return parsedDate.toLocaleDateString('en-GB');
  };

  const getStatusIcon = (status: string) => {
    return <StatusBadge status={status as StatusType} />;
  };

  return (
    <div className={`rounded-2xl p-6 shadow-lg border border-border/50 ${
      ["Staff", "Care Planning & Delivery", "Safety", "Continuous Improvement"].includes(title) 
        ? "bg-primary/10" 
        : "bg-white"
    }`}>
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          const storageKey = `section_${title.replace(/\s+/g, '_').toLowerCase()}_open`;
          sessionStorage.setItem(storageKey, JSON.stringify(newState));
        }}
      >
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            {getLastUpdated() && (
              <p className="text-sm text-muted-foreground mt-1">
                Updated: {getLastUpdated()}
              </p>
            )}
          </div>
          <div className="ml-4">
            {getStatusIcon(getOverallStatus())}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onAddItem && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddItem(title);
              }}
              className="clay-button p-2 hover:scale-105"
              title="Add new item"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          
          <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors">
            {isOpen ? 
              <ChevronDown className="w-5 h-5 text-muted-foreground" /> : 
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            }
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="space-y-2">
           {items.map((item) => (
            <StatusItem
              key={item.id}
              item={item}
              onStatusChange={onItemStatusChange}
              onObservationChange={onItemObservationChange}
              onActionsChange={onItemActionsChange}
              onDocumentsChange={onItemDocumentsChange}
              onMetadataChange={onItemMetadataChange}
              onActionCreated={onActionCreated}
              onSubsectionActionEdit={onSubsectionActionEdit}
              attendees={attendees}
              monthlyStaffData={monthlyStaffData}
              onMonthlyStaffDataChange={setMonthlyStaffData}
              meetingDate={meetingDate}
              meetingId={meetingId}
            />
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items in this section yet.</p>
              {onAddItem && (
                <button
                  onClick={() => onAddItem(title)}
                  className="clay-button mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </button>
              )}
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};