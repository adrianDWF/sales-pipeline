import "./env.js";

import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { assertApiEnvOnStartup } from "./lib/env-validation.js";

assertApiEnvOnStartup();

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`@sales-pipeline/api running on http://localhost:${port}`);
});
