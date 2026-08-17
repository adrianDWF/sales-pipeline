import { Hono } from "hono";

import { messageResponse } from "../lib/api-response.js";
import { isAuthorizedCronRequest } from "../lib/cron-auth.js";
import { pingSupabase } from "../lib/supabase-keep-alive.js";

const cron = new Hono();

cron.get("/keep-alive", async (c) => {
  if (!isAuthorizedCronRequest(c.req.header("Authorization"))) {
    return messageResponse(c, 401, "Unauthorized");
  }

  try {
    const result = await pingSupabase();
    return c.json({
      status: "ok",
      purpose: "supabase-keep-alive",
      ...result,
    });
  } catch (error) {
    console.error("Supabase keep-alive failed:", error);
    return messageResponse(c, 503, "Supabase keep-alive failed");
  }
});

export { cron };
