import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Square } from "lucide-react";

export type StatusType = "green" | "amber" | "red" | "na";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const statusConfig = {
  green: {
    label: "G",
    title: "On Track",
    className: "text-green-600"
  },
  amber: {
    label: "A",
    title: "At Risk",
    className: "text-amber-500"
  },
  red: {
    label: "R",
    title: "Critical",
    className: "text-red-600"
  },
  na: {
    label: "N/A",
    title: "Not Applicable",
    className: "text-gray-500"
  }
};

export const StatusBadge = ({
  status,
  className,
  onClick,
  disabled = false
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
    <div
      className={cn(
        "relative inline-flex items-center justify-center transition-all duration-300",
        onClick && !disabled && "cursor-pointer hover:scale-105",
        disabled && "opacity-50 cursor-not-allowed",
        isChanging && "scale-110",
        className
      )}
      title={config.title}
      onClick={onClick && !disabled ? onClick : undefined}
    >
      <Square 
        className={cn("w-12 h-12", config.className)} 
        fill="currentColor"
      />
      <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
        {config.label}
      </span>
    </div>
  );
};