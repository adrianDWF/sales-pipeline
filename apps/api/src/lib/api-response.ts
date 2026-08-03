import type { Context } from "hono";

const SAFE_ERROR_CODE = /^[a-z0-9_]+$/;

export function getSafeErrorMessage(
  error: unknown,
  fallback = "internal_server_error",
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  return SAFE_ERROR_CODE.test(message) ? message : fallback;
}

export function messageResponse(
  c: Context,
  status: number,
  message: string,
  extra?: Record<string, unknown>,
) {
  return c.json(
    {
      message,
      ...(extra ?? {}),
    },
    status as never,
  );
}

export function errorResponse(
  c: Context,
  status: number,
  error: unknown,
  fallback = "internal_server_error",
  extra?: Record<string, unknown>,
) {
  return messageResponse(c, status, getSafeErrorMessage(error, fallback), extra);
}
