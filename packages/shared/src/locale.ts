import { z } from "zod";

export const AppLocaleSchema = z.enum(["ro", "en"]);
export type AppLocale = z.infer<typeof AppLocaleSchema>;

export const DEFAULT_LOCALE: AppLocale = "ro";

export const SUPPORTED_LOCALES: { value: AppLocale; label: string }[] = [
  { value: "ro", label: "Română" },
  { value: "en", label: "English" },
];
