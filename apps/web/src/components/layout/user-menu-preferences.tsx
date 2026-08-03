"use client";

import {
  DISPLAY_CURRENCIES,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@sales-pipeline/shared";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updateUserPreferences } from "@/app/(app)/profile/actions";
import { useUserPreferences } from "@/components/user-preferences-provider";
import { cn } from "@/lib/utils";

export function UserMenuPreferences() {
  const { locale, currency, setLocale, setCurrency, t } = useUserPreferences();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleLocaleChange(next: AppLocale) {
    if (next === locale) return;
    setLocale(next);
    startTransition(async () => {
      await updateUserPreferences({ locale: next });
      router.refresh();
    });
  }

  function handleCurrencyChange(next: string) {
    if (next === currency) return;
    setCurrency(next);
    startTransition(async () => {
      await updateUserPreferences({ currency: next });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 border-t pt-2">
      <div>
        <p className="text-muted-foreground px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide">
          {t("userMenu", "language")}
        </p>
        <div className="grid grid-cols-2 gap-1">
          {SUPPORTED_LOCALES.map((item) => (
            <button
              key={item.value}
              type="button"
              disabled={pending}
              onClick={() => handleLocaleChange(item.value)}
              className={cn(
                "h-8 rounded-lg border px-2 text-xs font-medium transition-colors",
                locale === item.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-muted/60",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-muted-foreground px-1 pb-1.5 text-[11px] font-medium uppercase tracking-wide">
          {t("userMenu", "displayCurrency")}
        </p>
        <div className="grid grid-cols-2 gap-1">
          {DISPLAY_CURRENCIES.map((code) => (
            <button
              key={code}
              type="button"
              disabled={pending}
              onClick={() => handleCurrencyChange(code)}
              className={cn(
                "h-8 rounded-lg border px-2 text-xs font-medium transition-colors",
                currency === code
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-muted/60",
              )}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
