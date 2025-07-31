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
        "inline-flex items-center justify-center rounded-lg text-sm font-bold min-w-12 h-12 px-2",
        config.className,
        className
      )}
      title={config.title}
    >
      {config.label}
    </span>
  );
};