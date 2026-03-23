"use client";

import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { DashboardColorFilter } from "@/lib/gameFilters";

interface ColorFilterProps {
  value: DashboardColorFilter;
  onChange: (value: DashboardColorFilter) => void;
  className?: string;
}

export function ColorFilter({ value, onChange, className }: ColorFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as DashboardColorFilter)}
      className={cn("w-[120px]", className)}
    >
      <option value="all">All colors</option>
      <option value="white">White</option>
      <option value="black">Black</option>
    </Select>
  );
}
