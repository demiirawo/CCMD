import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Users, User, CheckCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { StatusType, StatusBadge } from "@/components/StatusBadge";
import { ActionItem } from "@/components/ActionForm";
import { Attendee } from "@/components/TeamAttendeesDisplay";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface ActionsPanelProps {
  sections: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      title: string;
      status: StatusType;
      lastReviewed: string;
      observation: string;
      actions: ActionItem[];
      details: string;
      metadata?: any;
    }>;
  }>;
  attendees: Attendee[];
  currentUserName?: string;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}

interface ProcessedAction extends ActionItem {
  sectionTitle: string;
  itemTitle: string;
  isMyAction: boolean;
  isWithinLast30Days: boolean;
  isCompleted: boolean;
  assignedTo?: string;
}

export function ActionsPanel({ 
  sections, 
  attendees, 
  currentUserName, 
  defaultOpen = false, 
  forceOpen = false 
}: ActionsPanelProps) {
  const { companies, profile } = useAuth();
  const currentCompany = companies.find(c => c.id === profile?.company_id);
  const isDynamicPanelColourEnabled = true;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Process all actions from subsections
  const processedActions = useMemo(() => {
    console.log('ActionsPanel: Processing actions from sections:', sections.length);
    const actions: ProcessedAction[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.actions && item.actions.length > 0) {
          console.log(`ActionsPanel: Found ${item.actions.length} actions in ${section.title} -> ${item.title}`);
          item.actions.forEach(action => {
            // Use the isCompleted field from the action
            const isCompleted = action.isCompleted || false;
            
            // Extract assignee name from action.name field (which contains the assignee)
            const assigneeName = action.name || 'Unassigned';
            
            // Determine if this is the current user's action
            const isMyAction = currentUserName ? 
              assigneeName.toLowerCase().includes(currentUserName.toLowerCase()) : false;

            // Check if action is within last 30 days (for completed actions)
            let isWithinLast30Days = true;
            if (isCompleted && action.completedAt) {
              const completedDate = new Date(action.completedAt);
              isWithinLast30Days = completedDate >= thirtyDaysAgo;
            } else if (action.targetDate) {
              const targetDate = new Date(action.targetDate);
              isWithinLast30Days = targetDate >= thirtyDaysAgo;
            }

            actions.push({
              ...action,
              sectionTitle: section.title,
              itemTitle: item.title,
              isMyAction,
              isWithinLast30Days,
              isCompleted,
              assignedTo: assigneeName
            });
          });
        }
      });
    });

    console.log('ActionsPanel: Total processed actions:', actions.length);
    return actions;
  }, [sections, currentUserName]);

  // Helper function to sort actions by due date (soonest first)
  const sortActionsByDueDate = (actions: ProcessedAction[]) => {
    return [...actions].sort((a, b) => {
      // Handle missing dates - put them at the end
      if (!a.targetDate && !b.targetDate) return 0;
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      
      // Parse dates correctly for dd/MM/yyyy format
      const parseDate = (dateString: string): Date => {
        if (dateString.includes('/')) {
          const [day, month, year] = dateString.split('/');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return new Date(dateString);
      };
      
      const dateA = parseDate(a.targetDate);
      const dateB = parseDate(b.targetDate);
      
      // Sort by date ascending (soonest first)
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Filter and sort actions into categories
  const myOpenActions = sortActionsByDueDate(
    processedActions.filter(action => action.isMyAction && !action.isCompleted)
  );

  const myClosedActions = sortActionsByDueDate(
    processedActions.filter(action => action.isMyAction && action.isCompleted && action.isWithinLast30Days)
  );

  const officeTeamOpenActions = sortActionsByDueDate(
    processedActions.filter(action => !action.isMyAction && !action.isCompleted)
  );

  const officeTeamClosedActions = sortActionsByDueDate(
    processedActions.filter(action => !action.isMyAction && action.isCompleted && action.isWithinLast30Days)
  );

  console.log('ActionsPanel: Action categories:', {
    myOpen: myOpenActions.length,
    myClosed: myClosedActions.length,
    officeOpen: officeTeamOpenActions.length,
    officeClosed: officeTeamClosedActions.length,
    totalCompleted: processedActions.filter(a => a.isCompleted).length
  });

  // Helper function to parse and format dates correctly
  const formatDateSafely = (dateString: string) => {
    if (!dateString) return 'No due date';
    
    try {
      // Handle dd/MM/yyyy format
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      }
      
      // Handle ISO format or other standard formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      
      // If all parsing fails, return the original string
      return dateString;
    } catch (error) {
      console.warn('Date parsing error:', error, 'for date:', dateString);
      return dateString;
    }
  };

  const getActionBackgroundClass = (action: ProcessedAction) => {
    // Completed actions should be grey
    if (action.isCompleted) {
      return 'bg-gray-50 border border-gray-200'; // Completed - grey background
    }
    
    if (!action.targetDate || action.targetDate === '' || action.targetDate === 'No due date') {
      return 'bg-gray-50 border border-gray-200'; // No due date - gray background
    }
    
    // Parse date correctly for dd/MM/yyyy format
    let dueDate: Date;
    try {
      if (action.targetDate.includes('/')) {
        const [day, month, year] = action.targetDate.split('/');
        dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        dueDate = new Date(action.targetDate);
      }
      
      // Check if date parsing failed
      if (isNaN(dueDate.getTime())) {
        return 'bg-gray-50 border border-gray-200'; // Invalid date - gray background
      }
    } catch (error) {
      return 'bg-gray-50 border border-gray-200'; // Error parsing date - gray background
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'bg-red-50 border border-red-200'; // Overdue - red background
    } else if (diffDays <= 5) {
      return 'bg-amber-50 border border-amber-200'; // Due within 5 days - amber background
    } else {
      return 'bg-green-50 border border-green-200'; // Due in more than 5 days - green background
    }
  };

  const renderActionsList = (actions: ProcessedAction[], title: string, icon: React.ReactNode) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm text-white">{title}</h4>
        <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/20">
          {actions.length}
        </Badge>
      </div>
      
      {actions.length === 0 ? (
        <p className="text-sm text-white/70 italic">No actions</p>
      ) : (
        <div className="space-y-2">
          {actions.map((action, index) => (
            <div key={`${action.id}-${index}`} className={`rounded-lg p-3 space-y-2 backdrop-blur-sm ${getActionBackgroundClass(action)}`}>
              {action.description && (
                <p className="text-xs text-black/70">
                  {action.description}
                </p>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-black">
                  {action.assignedTo || 'Unassigned'}
                </p>
              </div>
              
              <p className="text-xs text-black/70">
                {action.sectionTitle} → {action.itemTitle}
              </p>
              
              <div className="flex items-center justify-end text-xs text-black/60">
                {action.targetDate && (
                  <span>
                    Due: {formatDateSafely(action.targetDate)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const shouldBeOpen = forceOpen || isOpen;
  const totalActions = processedActions.length;
  
  // Determine overall status based on action priorities
  const getOverallStatus = (): StatusType => {
    if (totalActions === 0) return 'green';
    
    const openActions = processedActions.filter(action => !action.isCompleted);
    const overdueActions = openActions.filter(action => {
      if (!action.targetDate) return false;
      return new Date(action.targetDate) < new Date();
    });
    
    if (overdueActions.length > 0) return 'red';
    if (openActions.length > 5) return 'amber'; // Many open actions
    return 'green';
  };

  const getLastUpdated = () => {
    // Find the most recent action date
    if (processedActions.length === 0) return '';
    
    const dates = processedActions
      .map(action => action.targetDate)
      .filter(Boolean)
      .map(date => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    if (dates.length === 0) return new Date().toLocaleDateString('en-GB');
    
    return dates[0].toLocaleDateString('en-GB');
  };

  const getSectionBackgroundClass = (status: string) => {
    const baseClass = "-mx-8 px-14 py-6";
    
    // Use custom color for actions panel
    return `text-white ${baseClass}`;
  };

  const overallStatus = getOverallStatus();

  return (
    <div className={cn(
      "rounded-2xl shadow-lg -mx-8 px-14 py-6 text-white"
    )} style={{ backgroundColor: '#202A38' }}>
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
         <div className="flex items-center gap-3">
           <div>
             <h3 className={cn(
               "text-xl font-bold",
               isDynamicPanelColourEnabled ? "text-white" : "text-foreground"
             )}>Actions Summary</h3>
             {getLastUpdated() && (
               <p className={cn(
                 "text-sm mt-1 opacity-50 hidden",
                 isDynamicPanelColourEnabled ? "text-white/40" : "text-muted-foreground/60"
               )}>
                 Updated: {getLastUpdated()}
               </p>
             )}
           </div>
         </div>
        
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg hover:bg-accent/50 transition-colors">
            {shouldBeOpen ? (
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
      </div>

      {shouldBeOpen && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* My Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2 text-white">
                My Actions
              </h3>
              
              {renderActionsList(
                myOpenActions, 
                "Open Actions", 
                <Clock className="w-4 h-4 text-amber-300" />
              )}
              
              {renderActionsList(
                myClosedActions, 
                "Closed (Last 30 Days)", 
                <CheckCircle className="w-4 h-4 text-green-300" />
              )}
            </div>

            {/* Office Team Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2 text-white">
                Office Team Actions
              </h3>
              
              {renderActionsList(
                officeTeamOpenActions, 
                "Open Actions", 
                <Clock className="w-4 h-4 text-amber-300" />
              )}
              
              {renderActionsList(
                officeTeamClosedActions, 
                "Closed (Last 30 Days)", 
                <CheckCircle className="w-4 h-4 text-green-300" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}