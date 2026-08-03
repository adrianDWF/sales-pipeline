export const DEFAULT_CURRENCY = "EUR";

export const DISPLAY_CURRENCIES = ["RON", "EUR", "USD", "GBP"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

const LOCALE_BY_CURRENCY: Record<string, string> = {
  RON: "ro-RO",
  EUR: "de-DE",
  USD: "en-US",
  GBP: "en-GB",
};

export function resolveDisplayCurrency(
  snapshotCurrency: string | null | undefined,
  userPreferredCurrency: string | null | undefined,
  fallback: string = DEFAULT_CURRENCY,
): string {
  const normalized = (value: string | null | undefined) =>
    value?.trim().toUpperCase() || null;

  // User display preference wins so the account menu currency control applies app-wide.
  // Integration snapshot currency is the fallback when no preference is set.
  return (
    normalized(userPreferredCurrency) ??
    normalized(snapshotCurrency) ??
    fallback
  );
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale?: string,
): string {
  const resolvedLocale =
    locale ?? LOCALE_BY_CURRENCY[currency.toUpperCase()] ?? "en-US";

  try {
    return new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

export function pickDominantCurrency(
  currencies: Array<string | null | undefined>,
  userPreferredCurrency?: string | null,
): string {
  const counts = new Map<string, number>();
  for (const raw of currencies) {
    const code = raw?.trim().toUpperCase();
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return resolveDisplayCurrency(null, userPreferredCurrency);
  }

  let dominant = "";
  let max = 0;
  for (const [code, count] of counts) {
    if (count > max) {
      dominant = code;
      max = count;
    }
  }
  return dominant;
}
