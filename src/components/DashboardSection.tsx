import { StatusItem, StatusItemData } from "./StatusItem";
import { StatusType, StatusBadge } from "./StatusBadge";
import { ChevronDown, ChevronRight, Plus, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface DashboardSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: StatusItemData[];
  onItemStatusChange?: (id: string, status: StatusType) => void;
  onItemObservationChange?: (id: string, observation: string) => void;
  onItemTrendsThemesChange?: (id: string, trendsThemes: string) => void;
  onItemLessonsLearnedChange?: (id: string, lessonsLearned: string) => void;
  onItemActionsChange?: (id: string, actions: import("./ActionForm").ActionItem[]) => void;
  onItemDocumentsChange?: (id: string, documents: import("./StatusItem").DocumentData[]) => void;
  onItemMetadataChange?: (id: string, metadata: any) => void;
  onAddItem?: (sectionTitle: string) => void;
  onActionCreated?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string, subsectionActionId?: string) => void;
  onSubsectionActionEdit?: (sectionId: string, actionId: string, updates: { comment?: string; dueDate?: string }) => void;
  onSubsectionActionComplete?: (actionId: string) => void;
  onSubsectionActionDelete?: (actionId: string) => void;
  attendees?: string[];
  defaultOpen?: boolean;
  forceOpen?: boolean;
  onPanelStateChange?: () => void;
  meetingDate?: Date;
  meetingId?: string;
  panelStateTracker?: number;
  readOnly?: boolean;
}

export const DashboardSection = ({
  title,
  icon,
  items,
  onItemStatusChange,
  onItemObservationChange,
  onItemTrendsThemesChange,
  onItemLessonsLearnedChange,
  onItemActionsChange,
  onItemDocumentsChange,
  onItemMetadataChange,
  onAddItem,
  onActionCreated,
  onSubsectionActionEdit,
  onSubsectionActionComplete,
  onSubsectionActionDelete,
  attendees = [],
  defaultOpen = false,
  forceOpen,
  onPanelStateChange,
  meetingDate,
  meetingId,
  panelStateTracker,
  readOnly = false
}: DashboardSectionProps) => {
  const { companies, profile } = useAuth();
  const currentCompany = companies.find(c => c.id === profile?.company_id);
  const isDynamicPanelColourEnabled = true;
  const storageKey = `section_${title.replace(/\s+/g, '_').toLowerCase()}_open`;
  const [isOpen, setIsOpen] = useState(() => {
    const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
    const isolatedStorageKey = `${storageKey}_${tabId}`;
    const saved = sessionStorage.getItem(isolatedStorageKey);
    return saved !== null ? JSON.parse(saved) : defaultOpen;
  });
  
  // Listen for panel state changes to sync with sessionStorage
  useEffect(() => {
    const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
    const isolatedStorageKey = `${storageKey}_${tabId}`;
    const saved = sessionStorage.getItem(isolatedStorageKey);
    const savedState = saved !== null ? JSON.parse(saved) : defaultOpen;
    if (savedState !== isOpen) {
      setIsOpen(savedState);
    }
  }, [panelStateTracker, storageKey, defaultOpen, isOpen]);
  
  const isExpanded = isOpen;
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
    
    // Special logic for major sections
    const majorSections = ["Staff", "Care & Support", "Safety", "Continuous Improvement"];
    if (majorSections.includes(title)) {
      // If any subsection is red -> make major section red
      if (applicableCounts.red > 0) return 'red';
      
      // If more than one subsection is amber -> make major section amber
      if ((applicableCounts.amber || 0) > 1) return 'amber';
      
      // If only one subsection is amber but others are green -> keep major section green
      return 'green';
    }
    
    // Default logic for other sections
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
    // If it's already in DD/MM/YYYY format, return as is
    if (latestDate.includes('/') && latestDate.split('/').length === 3) {
      return latestDate;
    }
    // If it's already in a simple format like "24-Jul-25", return as is
    if (latestDate.includes('-') && latestDate.split('-').length === 3) {
      return latestDate;
    }
    
    // Otherwise, parse and format to a clean date
    const parseDate = (dateStr: string) => {
      // Handle DD/MM/YYYY format
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }
      // Handle DD-MMM-YY format
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
    
    try {
      const parsedDate = parseDate(latestDate);
      // Check if the parsed date is valid
      if (isNaN(parsedDate.getTime())) {
        return latestDate; // Return original string if parsing fails
      }
      return parsedDate.toLocaleDateString('en-GB');
    } catch (error) {
      return latestDate; // Return original string if any error occurs
    }
  };

  const getStatusIcon = (status: string) => {
    return <StatusBadge status={status as StatusType} />;
  };

  const getSectionBackgroundClass = (status: string) => {
    const isHighLevelPanel = ["Staff", "Care & Support", "Support Planning & Delivery", "Safety", "Continuous Improvement", "Key Review Dates", "Actions", "Supported Housing"].includes(title);
    const baseClass = isHighLevelPanel 
      ? "-mx-8 px-14 py-6" 
      : "p-6";
    
    // High level panels use dynamic color based on status when enabled
    if (isHighLevelPanel && isDynamicPanelColourEnabled) {
      switch (status) {
        case 'green':
          return `bg-status-green text-white ${baseClass}`;
        case 'amber':
          return `bg-status-amber text-white ${baseClass}`;
        case 'red':
          return `bg-status-red text-white ${baseClass}`;
        case 'na':
          return `bg-status-na text-white ${baseClass}`;
        default:
          return `bg-primary/10 ${baseClass}`;
      }
    }
    
    // High level panels use theme color background when dynamic color is disabled
    if (isHighLevelPanel) {
      return `bg-primary/10 ${baseClass}`;
    }
    
    // Other sections use status-based colors
    switch (status) {
      case 'green':
        return `bg-green-50/80 ${baseClass}`;
      case 'amber':
        return `bg-amber-50/80 ${baseClass}`;
      case 'red':
        return `bg-red-50/80 ${baseClass}`;
      case 'na':
        return `bg-gray-50/80 ${baseClass}`;
      default:
        return `bg-white ${baseClass}`;
    }
  };

  return (
    <div className={cn(
      "rounded-2xl shadow-lg",
      getSectionBackgroundClass(getOverallStatus())
    )}>
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          const storageKey = `section_${title.replace(/\s+/g, '_').toLowerCase()}_open`;
          const tabId = sessionStorage.getItem('__tab_id') || `tab_${Date.now()}`;
          const isolatedStorageKey = `${storageKey}_${tabId}`;
          sessionStorage.setItem(isolatedStorageKey, JSON.stringify(newState));
          onPanelStateChange?.();
        }}
      >
        <div className="flex items-center gap-3">
          <div>
            {(() => {
              const isHighLevelPanel = ["Staff", "Care & Support", "Support Planning & Delivery", "Safety", "Continuous Improvement", "Key Review Dates", "Actions", "Supported Housing"].includes(title);
              return (
                <>
                  <h3 className={cn(
                    "text-xl font-bold",
                    isHighLevelPanel && isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
                  )}>{title}</h3>
                  {getLastUpdated() && (
                    <p className={cn(
                      "text-sm mt-1",
                      isHighLevelPanel && isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
                    )}>
                      Updated: {getLastUpdated()}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
          <div className="ml-4">
            {getStatusIcon(getOverallStatus())}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onAddItem && !readOnly && (
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
            {(() => {
              const isHighLevelPanel = ["Staff", "Care & Support", "Support Planning & Delivery", "Safety", "Continuous Improvement", "Key Review Dates", "Actions", "Supported Housing"].includes(title);
              const iconClass = cn(
                "w-5 h-5",
                isHighLevelPanel && isDynamicPanelColourEnabled ? "text-white/80" : "text-muted-foreground"
              );
              return isExpanded ? 
                <ChevronDown className={iconClass} /> : 
                <ChevronRight className={iconClass} />;
            })()}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-2">
           {items.map((item) => (
            <StatusItem
              key={item.id}
              item={item}
              onStatusChange={readOnly ? undefined : onItemStatusChange}
              onObservationChange={readOnly ? undefined : onItemObservationChange}
              onTrendsThemesChange={readOnly ? undefined : onItemTrendsThemesChange}
              onLessonsLearnedChange={readOnly ? undefined : onItemLessonsLearnedChange}
              onActionsChange={readOnly ? undefined : onItemActionsChange}
              onDocumentsChange={readOnly ? undefined : onItemDocumentsChange}
              onMetadataChange={readOnly ? undefined : onItemMetadataChange}
              onActionCreated={readOnly ? undefined : onActionCreated}
              onSubsectionActionEdit={readOnly ? undefined : onSubsectionActionEdit}
              onSubsectionActionComplete={readOnly ? undefined : onSubsectionActionComplete}
              onSubsectionActionDelete={readOnly ? undefined : onSubsectionActionDelete}
              attendees={attendees}
              monthlyStaffData={monthlyStaffData}
              onMonthlyStaffDataChange={readOnly ? undefined : setMonthlyStaffData}
              meetingDate={meetingDate}
              meetingId={meetingId}
              readOnly={readOnly}
            />
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items in this section yet.</p>
              {onAddItem && !readOnly && (
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