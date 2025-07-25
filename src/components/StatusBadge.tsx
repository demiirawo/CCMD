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
export const StatusBadge = ({
  status,
  className
}: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <div 
      className={cn(
        "status-badge",
        config.className,
        className
      )}
      title={config.title}
    >
      {config.label}
    </div>
  );
};