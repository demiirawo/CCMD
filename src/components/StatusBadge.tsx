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
  return;
};