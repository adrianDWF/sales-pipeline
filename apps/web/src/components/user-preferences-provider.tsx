"use client";

import {
  formatCurrency as sharedFormatCurrency,
  resolveDisplayCurrency,
  type AppLocale,
} from "@sales-pipeline/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getDictionary, interpolate, type Dictionary } from "@/lib/i18n";

type UserPreferencesContextValue = {
  locale: AppLocale;
  currency: string;
  dictionary: Dictionary;
  t: (section: keyof Dictionary, key: string, vars?: Record<string, string>) => string;
  formatMetricValue: (
    value: number,
    format: "number" | "currency" | "percent" | "decimal",
    currencyOverride?: string | null,
  ) => string;
  setLocale: (locale: AppLocale) => void;
  setCurrency: (currency: string) => void;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

const LOCALE_TAG: Record<AppLocale, string> = {
  ro: "ro-RO",
  en: "en-US",
};

export function UserPreferencesProvider({
  children,
  initialLocale,
  initialCurrency,
}: {
  children: ReactNode;
  initialLocale: AppLocale;
  initialCurrency: string;
}) {
  const [locale, setLocale] = useState<AppLocale>(initialLocale);
  const [currency, setCurrency] = useState(initialCurrency);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const intlLocale = LOCALE_TAG[locale];

  const t = useCallback(
    (section: keyof Dictionary, key: string, vars?: Record<string, string>): string => {
      const group = dictionary[section] as Record<string, string>;
      const text = group[key] ?? key;
      return vars ? interpolate(text, vars) : text;
    },
    [dictionary],
  );

  const formatMetricValue = useCallback(
    (
      value: number,
      format: "number" | "currency" | "percent" | "decimal",
      currencyOverride?: string | null,
    ): string => {
      if (format === "currency") {
        const code = resolveDisplayCurrency(currencyOverride, currency);
        return sharedFormatCurrency(value, code, intlLocale);
      }
      if (format === "percent") {
        return new Intl.NumberFormat(intlLocale, {
          style: "percent",
          maximumFractionDigits: 1,
        }).format(value / 100);
      }
      if (format === "decimal") return value.toFixed(1);
      return new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(value);
    },
    [currency, intlLocale],
  );

  const value = useMemo(
    () => ({ locale, currency, dictionary, t, formatMetricValue, setLocale, setCurrency }),
    [locale, currency, dictionary, t, formatMetricValue],
  );

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error("useUserPreferences must be used within UserPreferencesProvider");
  }
  return ctx;
}

export function useOptionalUserPreferences() {
  return useContext(UserPreferencesContext);
}
