"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, value, onValueChange, onChange, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          value={value}
          onChange={(e) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          className={cn(
            "flex h-10 w-full items-center rounded-lg border border-border/50 bg-background-secondary/80 backdrop-blur-sm px-4 py-2 pr-10 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue",
            "transition-all duration-200 cursor-pointer appearance-none",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = "Select";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("hidden", className)} {...props}>
    {children}
  </div>
));
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => (
  <option
    ref={ref}
    className={cn("bg-background-secondary text-foreground", className)}
    {...props}
  >
    {children}
  </option>
));
SelectItem.displayName = "SelectItem";

const SelectTrigger = Select;
const SelectValue = () => null;

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
