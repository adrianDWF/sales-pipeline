import { Hono } from "hono";
import { cors } from "hono/cors";

import { errorResponse } from "./lib/api-response.js";
import { logRequestLine } from "./lib/safe-logger.js";
import { cron } from "./routes/cron.js";
import { webhooks } from "./routes/webhooks.js";

const app = new Hono();
const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://sales-pipeline-web.vercel.app"
    : "http://localhost:3000");

function isAllowedAppOrigin(origin: string) {
  if (!origin) return false;

  if (
    origin === APP_ORIGIN ||
    origin === "http://localhost:3000" ||
    origin === "http://127.0.0.1:3000"
  ) {
    return true;
  }

  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    return (
      url.hostname === "sales-pipeline-web.vercel.app" ||
      (url.hostname.startsWith("sales-pipeline-") && url.hostname.endsWith(".vercel.app"))
    );
  } catch {
    return false;
  }
}

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logRequestLine(c.req.method, c.req.url, c.res.status, Date.now() - start);
});

app.use(
  "*",
  cors({
    origin: (origin) => (isAllowedAppOrigin(origin) ? origin : ""),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.get("/", (c) =>
  c.json({
    service: "sales-pipeline-api",
    status: "ok",
    links: {
      health: "/health",
      app: APP_ORIGIN,
    },
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/cron", cron);
app.route("/webhooks", webhooks);

app.onError((error, c) => {
  console.error(error);
  return errorResponse(c, 500, error);
});

export { app };
export default app;
