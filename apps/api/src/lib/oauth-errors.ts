const SAFE_OAUTH_ERROR_CODES = new Set([
  "missing_oauth_params",
  "oauth_state_expired",
  "oauth_state_invalid",
  "oauth_state_already_used",
  "oauth_state_not_found",
  "oauth_failed",
  "tag_manager_api_disabled",
  "tag_manager_rate_limited",
  "google_business_api_disabled",
  "google_business_api_access_denied",
]);

export function toOAuthRedirectError(error: unknown): string {
  if (error instanceof Error && SAFE_OAUTH_ERROR_CODES.has(error.message)) {
    return error.message;
  }
  return "oauth_failed";
}
