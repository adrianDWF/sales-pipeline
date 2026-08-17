export function isAuthorizedCronRequest(authHeader: string | undefined): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  return authHeader === `Bearer ${secret}`;
}
