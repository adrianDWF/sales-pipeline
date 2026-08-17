export function companyFaviconUrl(websiteUrl: string | null | undefined): string | undefined {
  if (!websiteUrl?.trim()) return undefined;
  try {
    const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return undefined;
  }
}

export function companyInitials(company: string | null | undefined, contact: string) {
  const source = company?.trim() || contact;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
