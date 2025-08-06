import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
  const [isChanging, setIsChanging] = useState(false);
  const [prevStatus, setPrevStatus] = useState(status);

  useEffect(() => {
    if (prevStatus !== status) {
      setIsChanging(true);
      
      // Reset changing state after animation
      setTimeout(() => setIsChanging(false), 300);
      setPrevStatus(status);
    }
  }, [status, prevStatus]);
  
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-lg font-bold min-w-16 h-16 px-3 transition-all duration-300 shadow-none border border-white",
        config.className,
        isChanging && "animate-scale-in",
        className
      )}
      title={config.title}
      style={{ boxShadow: '0 0 0 1px white' }}
    >
      {config.label}
    </span>
  );
};