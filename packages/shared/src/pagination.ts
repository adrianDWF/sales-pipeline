import { z } from "zod";

export const DEFAULT_LIST_LIMIT = 50;
export const MAX_LIST_LIMIT = 200;

export const ListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_LIST_LIMIT)
    .default(DEFAULT_LIST_LIMIT)
    .optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
});

export type ListQuery = z.infer<typeof ListQuerySchema>;

export function clampListLimit(limit?: number | null): number {
  if (limit == null || Number.isNaN(limit)) {
    return DEFAULT_LIST_LIMIT;
  }
  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIST_LIMIT);
}
