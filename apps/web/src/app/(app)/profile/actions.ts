"use server";

import {
  AppLocaleSchema,
  DISPLAY_CURRENCIES,
  type AppLocale,
} from "@sales-pipeline/shared";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

const LOCALE_COOKIE = "insuite_locale";
const CURRENCY_COOKIE = "insuite_currency";

export async function updateUserPreferences(input: {
  locale?: AppLocale;
  currency?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not_authenticated" };

  const updates: Record<string, string> = {};

  if (input.locale) {
    const parsed = AppLocaleSchema.safeParse(input.locale);
    if (!parsed.success) return { error: "invalid_locale" };
    updates.preferred_locale = parsed.data;
  }

  if (input.currency) {
    const code = input.currency.toUpperCase();
    if (!DISPLAY_CURRENCIES.includes(code as (typeof DISPLAY_CURRENCIES)[number])) {
      return { error: "invalid_currency" };
    }
    updates.preferred_currency = code;
  }

  if (Object.keys(updates).length === 0) return { error: "no_changes" };

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) return { error: error.message };

  const cookieStore = await cookies();
  if (updates.preferred_locale) {
    cookieStore.set(LOCALE_COOKIE, updates.preferred_locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  if (updates.preferred_currency) {
    cookieStore.set(CURRENCY_COOKIE, updates.preferred_currency, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}
