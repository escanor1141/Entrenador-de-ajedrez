"use client";

import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { DashboardTimeFilter } from "@/lib/gameFilters";

interface TimeFilterProps {
  value: DashboardTimeFilter;
  onChange: (value: DashboardTimeFilter) => void;
  className?: string;
}

export function TimeFilter({ value, onChange, className }: TimeFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as DashboardTimeFilter)}
      className={cn("w-[150px]", className)}
    >
      <option value="all">All games</option>
      <option value="bullet">Bullet</option>
      <option value="blitz">Blitz</option>
      <option value="rapid">Rapid</option>
      <option value="classical">Classical</option>
    </Select>
  );
}
