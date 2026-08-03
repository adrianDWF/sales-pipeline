"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

type CheckboxState = boolean | "indeterminate";

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
}: {
  checked: CheckboxState;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const isIndeterminate = checked === "indeterminate";
  const ariaChecked = isIndeterminate ? "mixed" : checked;

  return (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={ariaChecked}
      disabled={disabled}
      onClick={() => {
        onCheckedChange?.(isIndeterminate ? true : !checked);
      }}
      className={cn(
        "border-primary focus-visible:ring-ring/50 flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked || isIndeterminate
          ? "bg-primary text-primary-foreground"
          : "bg-background",
        className,
      )}
    >
      {checked === true ? <Check className="size-3" strokeWidth={3} /> : null}
      {isIndeterminate ? <Minus className="size-3" strokeWidth={3} /> : null}
    </button>
  );
}
