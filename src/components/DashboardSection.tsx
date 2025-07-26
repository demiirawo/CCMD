import { StatusItem, StatusItemData } from "./StatusItem";
import { StatusType, StatusBadge } from "./StatusBadge";
import { CapacityAnalytics } from "./CapacityAnalytics";
import { ChevronDown, ChevronRight, Plus, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useState } from "react";

interface DashboardSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: StatusItemData[];
  onItemStatusChange?: (id: string, status: StatusType) => void;
  onItemObservationChange?: (id: string, observation: string) => void;
  onItemActionsChange?: (id: string, actions: string) => void;
  onAddItem?: (sectionTitle: string) => void;
  onActionCreated?: (itemTitle: string, mentionedAttendee: string, comment: string, action: string, dueDate: string) => void;
  defaultOpen?: boolean;
}

export const DashboardSection = ({
  title,
  icon,
  items,
  onItemStatusChange,
  onItemObservationChange,
  onItemActionsChange,
  onAddItem,
  onActionCreated,
  defaultOpen = true
}: DashboardSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const statusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<StatusType, number>);

  const getOverallStatus = () => {
    if (statusCounts.red > 0) return 'red';
    if (statusCounts.amber > 0) return 'amber';
    return 'green';
  };

  const getStatusIcon = (status: string) => {
    return <StatusBadge status={status as StatusType} />;
  };

  return (
    <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-border/50">
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
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
              onActionCreated={onActionCreated}
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