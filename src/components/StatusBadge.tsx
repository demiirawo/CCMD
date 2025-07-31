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
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);
  const [prevStatus, setPrevStatus] = useState(status);

  useEffect(() => {
    if (prevStatus !== status) {
      setIsChanging(true);
      
      // Special success glow for green status
      if (status === 'green' && prevStatus !== 'green') {
        setShowSuccessGlow(true);
        setTimeout(() => setShowSuccessGlow(false), 1000);
      }
      
      // Reset changing state after animation
      setTimeout(() => setIsChanging(false), 300);
      setPrevStatus(status);
    }
  }, [status, prevStatus]);
  
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-sm font-bold min-w-12 h-12 px-2 transition-all duration-300",
        config.className,
        isChanging && "animate-scale-in shadow-lg",
        showSuccessGlow && "success-glow animate-pulse",
        className
      )}
      title={config.title}
    >
      {config.label}
    </span>
  );
};