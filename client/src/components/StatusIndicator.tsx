import React from "react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  active: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  active,
  className = "",
  size = "sm",
}) => {
  const sizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div
      className={cn(
        "relative rounded-full border border-white/70 shadow-[0_0_0_3px_rgba(255,255,255,0.72)]",
        active
          ? "bg-[hsl(var(--success-green))] before:absolute before:inset-[30%] before:rounded-full before:bg-white"
          : "bg-[hsl(var(--inactive-color))] before:absolute before:inset-[33%_24%] before:rounded-sm before:bg-white/80",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={active ? "Active" : "Inactive"}
      title={active ? "Active" : "Inactive"}
    />
  );
};

export default StatusIndicator;
