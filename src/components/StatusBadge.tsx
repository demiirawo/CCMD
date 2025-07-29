import { cn } from "@/lib/utils";
export type StatusType = "green" | "amber" | "red" | "na";
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
  },
  na: {
    label: "N/A",
    title: "Not Applicable",
    className: "status-na"
  }
};
export const StatusBadge = ({
  status,
  className
}: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full text-xs font-medium min-w-6 h-6 px-1",
        config.className,
        className
      )}
      title={config.title}
    >
      {config.label}
    </span>
  );
};