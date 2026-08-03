"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FilterSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export function FilterSelect({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder,
  className,
  triggerClassName,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}) {
  const selectValue = value === "" ? "__all__" : value;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={selectValue}
        onValueChange={(next) => onValueChange(next === "__all__" ? "" : next)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "w-full min-w-[140px]",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
          {placeholder ? (
            <SelectItem value="__all__">{placeholder}</SelectItem>
          ) : null}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
