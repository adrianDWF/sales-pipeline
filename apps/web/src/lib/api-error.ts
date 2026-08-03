import { isApiErrorResponse } from "@sales-pipeline/shared";

const DEFAULT_ERROR_MESSAGE = "Request failed";

export function parseApiErrorBody(value: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  if (isApiErrorResponse(value)) {
    return value.message;
  }

  return fallback;
}

export async function readApiErrorMessage(
  response: Response,
  fallback = DEFAULT_ERROR_MESSAGE,
): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  return parseApiErrorBody(body, fallback);
}
