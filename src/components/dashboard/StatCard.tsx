"use client";

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  isLoading?: boolean;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
  default: "from-background-secondary to-background-tertiary",
  success: "from-green-950/50 to-background-secondary",
  warning: "from-yellow-950/50 to-background-secondary",
  danger: "from-red-950/50 to-background-secondary",
  info: "from-blue-950/50 to-background-secondary",
};

const iconBgStyles = {
  default: "bg-background-tertiary text-muted-foreground",
  success: "bg-green-500/20 text-green-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  danger: "bg-red-500/20 text-red-400",
  info: "bg-blue-500/20 text-blue-400",
};

export function StatCard({
  label,
  value,
  subValue,
  icon,
  trend,
  isLoading,
  className,
  variant = "default",
}: StatCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "glass-card p-6 animate-pulse",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-background-tertiary rounded w-20" />
          <div className="w-10 h-10 bg-background-tertiary rounded-lg" />
        </div>
        <div className="h-10 bg-background-tertiary rounded w-28 mb-2" />
        <div className="h-4 bg-background-tertiary rounded w-16" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card p-6 card-hover relative overflow-hidden",
        className
      )}
    >
      {/* Background gradient based on variant */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        variantStyles[variant]
      )} />
      
      <div className="relative">
        {/* Header with label and icon */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            {label}
          </span>
          {icon && (
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              iconBgStyles[variant]
            )}>
              {icon}
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="stat-value">{value}</span>
          {subValue && (
            <span className="text-sm text-muted-foreground truncate max-w-[120px]">
              {subValue}
            </span>
          )}
        </div>

        {/* Trend indicator */}
        {trend && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-sm mt-2 px-2 py-1 rounded-full",
              trend.positive 
                ? "bg-green-500/10 text-green-400" 
                : "bg-red-500/10 text-red-400"
            )}
          >
            <span className={cn(
              "w-0 h-0 border-l-[4px] border-r-[4px] border-transparent",
              trend.positive 
                ? "border-b-[6px] border-b-green-400" 
                : "border-t-[6px] border-t-red-400"
            )} />
            {trend.positive ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>
    </div>
  );
}
