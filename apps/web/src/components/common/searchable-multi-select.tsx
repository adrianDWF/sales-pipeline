"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchableMultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type SearchableMultiSelectProps = {
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: SearchableMultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  maxVisibleBadges?: number;
  showSelectedCount?: boolean;
  clearable?: boolean;
  className?: string;
};

export function SearchableMultiSelect({
  label,
  placeholder = "Select options…",
  searchPlaceholder = "Search…",
  options,
  value,
  onValueChange,
  disabled,
  loading,
  error,
  emptyMessage = "No results found.",
  maxVisibleBadges = 2,
  showSelectedCount = true,
  clearable = true,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(
    () => options.filter((opt) => value.includes(opt.value)),
    [options, value],
  );

  function toggleOption(optionValue: string) {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue));
    } else {
      onValueChange([...value, optionValue]);
    }
  }

  function clearAll() {
    onValueChange([]);
  }

  function selectAllEnabled() {
    onValueChange(options.filter((opt) => !opt.disabled).map((opt) => opt.value));
  }

  const triggerLabel = (() => {
    if (loading) return "Loading…";
    if (selected.length === 0) return placeholder;
    if (showSelectedCount && selected.length > maxVisibleBadges) {
      return `${selected.length} selected`;
    }
    return null;
  })();

  const errorId = error ? `${label ?? "multi-select"}-error` : undefined;

  return (
    <div ref={containerRef} className={cn("space-y-1.5", className)}>
      {label ? <Label>{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={Boolean(error)}
            aria-describedby={errorId}
            disabled={disabled || loading}
            className={cn(
              "border-input bg-background h-10 w-full justify-between px-3 font-normal",
              !selected.length && "text-muted-foreground",
            )}
          >
            <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left">
              {triggerLabel ??
                selected.slice(0, maxVisibleBadges).map((opt) => (
                  <Badge
                    key={opt.value}
                    variant="secondary"
                    className="max-w-[8rem] truncate text-xs font-normal"
                  >
                    {opt.label}
                  </Badge>
                ))}
              {!triggerLabel && selected.length > maxVisibleBadges ? (
                <Badge variant="secondary" className="text-xs font-normal">
                  +{selected.length - maxVisibleBadges}
                </Badge>
              ) : null}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          container={containerRef.current}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-64 touch-pan-y overscroll-contain overflow-y-auto">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => {
                  const checked = value.includes(opt.value);
                  return (
                    <CommandItem
                      key={opt.value}
                      value={`${opt.label} ${opt.description ?? ""}`}
                      disabled={opt.disabled}
                      onSelect={() => toggleOption(opt.value)}
                      className="flex items-start gap-2"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={opt.disabled}
                        className="mt-0.5"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          <span className="truncate">{opt.label}</span>
                          {checked ? (
                            <Check className="text-primary ml-auto size-4 shrink-0" />
                          ) : null}
                        </div>
                        {opt.description ? (
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {opt.description}
                          </p>
                        ) : null}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          {clearable || options.length > 0 ? (
            <div className="flex items-center justify-between gap-2 border-t px-2 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={selectAllEnabled}
              >
                Select all
              </Button>
              {clearable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={clearAll}
                  disabled={value.length === 0}
                >
                  <X className="mr-1 size-3.5" />
                  Clear
                </Button>
              ) : null}
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
      {error ? (
        <p id={errorId} className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
