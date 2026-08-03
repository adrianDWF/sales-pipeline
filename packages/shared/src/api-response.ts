/** Shared API response shapes for web + API clients. */

export type ApiErrorResponse = {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};

export type ApiMessageResponse = ApiErrorResponse;

export type ApiOkResponse<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: true;
} & T;

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as ApiErrorResponse).message === "string"
  );
}
