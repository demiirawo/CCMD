import { StatusItem, StatusItemData } from "./StatusItem";
import { StatusType } from "./StatusBadge";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

interface DashboardSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: StatusItemData[];
  onItemStatusChange?: (id: string, status: StatusType) => void;
  onItemCommentChange?: (id: string, comment: string) => void;
  onAddItem?: (sectionTitle: string) => void;
  defaultOpen?: boolean;
}

export const DashboardSection = ({
  title,
  icon,
  items,
  onItemStatusChange,
  onItemCommentChange,
  onAddItem,
  defaultOpen = true
}: DashboardSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const statusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<StatusType, number>);

  return (
    <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-border/50">
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <div className="flex gap-2 ml-4">
            {statusCounts.green > 0 && (
              <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-sm font-medium">
                {statusCounts.green} ✓
              </span>
            )}
            {statusCounts.amber > 0 && (
              <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-sm font-medium">
                {statusCounts.amber} ⚠
              </span>
            )}
            {statusCounts.red > 0 && (
              <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-sm font-medium">
                {statusCounts.red} ⚠
              </span>
            )}
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
              onCommentChange={onItemCommentChange}
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