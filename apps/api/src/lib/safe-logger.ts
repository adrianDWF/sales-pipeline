const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "access_token",
  "refresh_token",
  "code",
  "state",
  "jwt",
  "auth_code",
]);

export function redactUrlForLogs(url: string): string {
  try {
    const parsed = new URL(url, "http://localhost");
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, "[redacted]");
      }
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "[invalid-url]";
  }
}

export function logRequestLine(
  method: string,
  url: string,
  status: number,
  durationMs: number,
) {
  console.log(`${method} ${redactUrlForLogs(url)} ${status} ${durationMs}ms`);
}
