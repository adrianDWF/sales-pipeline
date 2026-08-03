import type { AppLocale } from "@sales-pipeline/shared";

/**
 * Safe display formatters — never leak raw null/undefined/NaN into UI.
 */

export const EMPTY_DISPLAY = "—";

const LOCALE_TAG: Record<AppLocale, string> = {
  ro: "ro-RO",
  en: "en-US",
};

/** Stable SSR/client datetime formatting (UTC) for cache/sync timestamps. */
export function formatDateTime(
  value: string | null | undefined,
  locale: AppLocale,
): string {
  if (!value) return EMPTY_DISPLAY;
  return new Date(value).toLocaleString(LOCALE_TAG[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

/** Stable SSR/client date-only formatting (UTC). */
export function formatDateOnly(
  value: string | null | undefined,
  locale: AppLocale,
): string {
  if (!value) return EMPTY_DISPLAY;
  return new Date(value).toLocaleDateString(LOCALE_TAG[locale], {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}

export function formatInteger(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDisplayValue(
  value: string | number | null | undefined,
  format?: (value: number) => string,
): string {
  if (value == null) return EMPTY_DISPLAY;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed === "" ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      trimmed === "NaN"
    ) {
      return EMPTY_DISPLAY;
    }
    return trimmed;
  }
  if (Number.isNaN(value)) return EMPTY_DISPLAY;
  return format ? format(value) : String(value);
}
