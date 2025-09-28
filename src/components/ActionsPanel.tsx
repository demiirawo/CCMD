import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User, CheckCircle, Clock } from "lucide-react";
import { StatusType } from "@/components/StatusBadge";
import { ActionItem } from "@/components/ActionForm";
import { Attendee } from "@/components/TeamAttendeesDisplay";

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
}

interface ProcessedAction extends ActionItem {
  sectionTitle: string;
  itemTitle: string;
  isMyAction: boolean;
  isWithinLast30Days: boolean;
  isCompleted: boolean;
  assignedTo?: string;
}

export function ActionsPanel({ sections, attendees, currentUserName }: ActionsPanelProps) {
  // Process all actions from subsections
  const processedActions = useMemo(() => {
    const actions: ProcessedAction[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    sections.forEach(section => {
      section.items.forEach(item => {
        item.actions.forEach(action => {
          // For now, assume actions are completed if they're older than due date
          // In a real implementation, you'd have a completion status
          const isCompleted = false; // ActionItem doesn't have completion status yet
          
          // Determine if this is the current user's action
          // Since ActionItem doesn't have assignee, we'll use a simple heuristic
          const isMyAction = currentUserName ? 
            action.description.toLowerCase().includes(currentUserName.toLowerCase()) ||
            action.name.toLowerCase().includes(currentUserName.toLowerCase()) : false;

          // Check if action is within last 30 days (for old actions)
          let isWithinLast30Days = true;
          if (action.targetDate) {
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
            assignedTo: isMyAction ? currentUserName : 'Office Team'
          });
        });
      });
    });

    return actions;
  }, [sections, currentUserName]);

  // Filter actions into categories
  const myOpenActions = processedActions.filter(action => 
    action.isMyAction && !action.isCompleted
  );

  const myClosedActions = processedActions.filter(action => 
    action.isMyAction && action.isCompleted && action.isWithinLast30Days
  );

  const officeTeamOpenActions = processedActions.filter(action => 
    !action.isMyAction && !action.isCompleted
  );

  const officeTeamClosedActions = processedActions.filter(action => 
    !action.isMyAction && action.isCompleted && action.isWithinLast30Days
  );

  const renderActionsList = (actions: ProcessedAction[], title: string, icon: React.ReactNode) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="secondary" className="text-xs">
          {actions.length}
        </Badge>
      </div>
      
      {actions.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No actions</p>
      ) : (
        <div className="space-y-2">
          {actions.map((action, index) => (
            <div key={`${action.id}-${index}`} className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {action.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {action.sectionTitle} → {action.itemTitle}
                  </p>
                </div>
                <Badge 
                  variant={action.isCompleted ? 'default' : 'secondary'}
                  className="text-xs shrink-0"
                >
                  {action.isCompleted ? 'Completed' : 'Open'}
                </Badge>
              </div>
              
              {action.description && (
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {action.assignedTo ? `Assigned to: ${action.assignedTo}` : 'Unassigned'}
                </span>
                {action.targetDate && (
                  <span>
                    Due: {new Date(action.targetDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Actions Summary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time summary of all actions from subsections
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* My Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              My Actions
            </h3>
            
            {renderActionsList(
              myOpenActions, 
              "Open Actions", 
              <Clock className="w-4 h-4 text-amber-600" />
            )}
            
            {renderActionsList(
              myClosedActions, 
              "Closed (Last 30 Days)", 
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
          </div>

          {/* Office Team Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Office Team Actions
            </h3>
            
            {renderActionsList(
              officeTeamOpenActions, 
              "Open Actions", 
              <Clock className="w-4 h-4 text-amber-600" />
            )}
            
            {renderActionsList(
              officeTeamClosedActions, 
              "Closed (Last 30 Days)", 
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}