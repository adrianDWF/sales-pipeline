type GmailHeader = { name?: string; value?: string };

type GmailMessagePart = {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
};

export type GmailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  payload?: GmailMessagePart & { headers?: GmailHeader[] };
  internalDate?: string;
};

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function getHeader(headers: GmailHeader[] | undefined, name: string): string {
  const match = headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return match?.value?.trim() ?? "";
}

function parseAddressList(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((part) => {
      const angle = part.match(/<([^>]+)>/);
      return (angle?.[1] ?? part).trim();
    })
    .filter(Boolean);
}

function collectBodies(part: GmailMessagePart | undefined, acc: { text: string; html: string }) {
  if (!part) return;

  const data = part.body?.data;
  if (data) {
    const decoded = decodeBase64Url(data);
    if (part.mimeType === "text/plain" && !acc.text) {
      acc.text = decoded;
    } else if (part.mimeType === "text/html" && !acc.html) {
      acc.html = decoded;
    }
  }

  for (const child of part.parts ?? []) {
    collectBodies(child, acc);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGmailMessage(message: GmailMessage, mailboxEmail: string) {
  const headers = message.payload?.headers;
  const subject = getHeader(headers, "Subject") || "(Fără subiect)";
  const from = getHeader(headers, "From");
  const to = parseAddressList(getHeader(headers, "To"));
  const cc = parseAddressList(getHeader(headers, "Cc"));
  const dateHeader = getHeader(headers, "Date");
  const internalDate = message.internalDate
    ? new Date(Number(message.internalDate)).toISOString()
    : null;
  const date = dateHeader
    ? new Date(dateHeader).toISOString()
    : internalDate ?? new Date().toISOString();

  const bodies = { text: "", html: "" };
  collectBodies(message.payload, bodies);
  const body = bodies.text || (bodies.html ? stripHtml(bodies.html) : message.snippet ?? "");

  return {
    id: message.id,
    subject,
    from,
    to: [...to, ...cc],
    date,
    body,
    snippet: message.snippet,
    mailboxEmail,
  };
}

export function extractDomainFromWebsite(websiteUrl: string | null | undefined): string | null {
  if (!websiteUrl?.trim()) return null;
  try {
    const normalized = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    const hostname = new URL(normalized).hostname.replace(/^www\./, "");
    return hostname || null;
  } catch {
    const cleaned = websiteUrl
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
    return cleaned || null;
  }
}

export function extractDomainFromEmail(email: string | null | undefined): string | null {
  if (!email?.includes("@")) return null;
  return email.split("@")[1]?.toLowerCase() ?? null;
}

export function buildLeadGmailSearchQuery(input: {
  email: string | null | undefined;
  websiteUrl: string | null | undefined;
}): string | null {
  const clauses: string[] = [];
  const leadEmail = input.email?.trim().toLowerCase();

  if (leadEmail) {
    clauses.push(`from:${leadEmail}`, `to:${leadEmail}`);
  }

  const domain =
    extractDomainFromWebsite(input.websiteUrl) ?? extractDomainFromEmail(leadEmail);
  if (domain) {
    clauses.push(`from:@${domain}`, `to:@${domain}`);
  }

  if (clauses.length === 0) return null;
  return `{${clauses.join(" ")}}`;
}
