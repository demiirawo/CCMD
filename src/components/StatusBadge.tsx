import { cn } from "@/lib/utils";

export type StatusType = "green" | "amber" | "red";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  green: {
    label: "G",
    title: "On Track",
    className: "status-green"
  },
  amber: {
    label: "A", 
    title: "At Risk",
    className: "status-amber"
  },
  red: {
    label: "R",
    title: "Critical",
    className: "status-red"
  }
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <div 
      className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 hover:scale-110",
        config.className,
        className
      )}
      title={config.title}
    >
      {config.label}
    </div>
  );
};