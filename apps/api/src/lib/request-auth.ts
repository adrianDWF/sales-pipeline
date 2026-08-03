import type { Context } from "hono";

import { messageResponse } from "./api-response.js";
import { getBearerToken, verifySupabaseToken } from "./auth.js";

/** OAuth start routes accept only Authorization: Bearer — never query tokens. */
export function getRequestAuthToken(c: Context): string | null {
  return getBearerToken(c.req.header("Authorization"));
}

export async function requireRequestUser(c: Context) {
  const token = getRequestAuthToken(c);
  if (!token) {
    return { error: messageResponse(c, 401, "Unauthorized") as Response };
  }

  try {
    const user = await verifySupabaseToken(token);
    return { user, token };
  } catch {
    return { error: messageResponse(c, 401, "Unauthorized") as Response };
  }
}
