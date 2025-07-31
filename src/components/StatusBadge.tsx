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
  const [showFireworks, setShowFireworks] = useState(false);
  const [prevStatus, setPrevStatus] = useState(status);

  useEffect(() => {
    if (prevStatus !== status) {
      setIsChanging(true);
      
      // Special success glow and fireworks for green status
      if (status === 'green' && prevStatus !== 'green') {
        setShowSuccessGlow(true);
        setShowFireworks(true);
        setTimeout(() => {
          setShowSuccessGlow(false);
          setShowFireworks(false);
        }, 1500);
      }
      
      // Reset changing state after animation
      setTimeout(() => setIsChanging(false), 300);
      setPrevStatus(status);
    }
  }, [status, prevStatus]);
  
  return (
    <div className="relative">
      {/* Fireworks Animation */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Multiple firework particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-20px)`,
                animationDelay: `${i * 50}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
          {/* Additional sparkle effect */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-400 rounded-full animate-ping"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-15px)`,
                animationDelay: `${200 + i * 30}ms`,
                animationDuration: '0.8s'
              }}
            />
          ))}
          {/* Outer ring effect */}
          <div 
            className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-green-400 rounded-full animate-ping opacity-50"
            style={{
              transform: 'translate(-50%, -50%)',
              animationDuration: '1.2s'
            }}
          />
        </div>
      )}
      
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg text-lg font-bold min-w-16 h-16 px-3 transition-all duration-300 shadow-none z-10",
          config.className,
          isChanging && "animate-scale-in",
          showSuccessGlow && "success-glow animate-pulse",
          className
        )}
        title={config.title}
        style={{ boxShadow: 'none' }}
      >
        {config.label}
      </span>
    </div>
  );
};