import type { AppLocale } from "@sales-pipeline/shared";

import { en, type Dictionary } from "./dictionaries/en";
import { ro } from "./dictionaries/ro";

const dictionaries: Record<AppLocale, Dictionary> = { en, ro };

export function getDictionary(locale: AppLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries.ro;
}

export function interpolate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export type { Dictionary };
