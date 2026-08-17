import type { LeadCommunication } from "@sales-pipeline/shared";

import {
  getGmailMessage,
  getValidGmailAccessToken,
  listTeamGmailConnections,
  searchGmailMessages,
} from "./connections";
import { isGmailOAuthConfigured } from "./config";
import { buildLeadGmailSearchQuery, parseGmailMessage } from "./message-parser";

export async function fetchLeadCommunications(input: {
  email: string | null | undefined;
  websiteUrl: string | null | undefined;
}): Promise<{ communications: LeadCommunication[]; warning?: string }> {
  if (!isGmailOAuthConfigured()) {
    return {
      communications: [],
      warning:
        "Integrarea Gmail nu este configurată. Adaugă GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH_STATE_SECRET și TOKEN_ENCRYPTION_KEY.",
    };
  }

  const query = buildLeadGmailSearchQuery(input);
  if (!query) {
    return {
      communications: [],
      warning: "Lead-ul nu are email sau domeniu pentru căutare.",
    };
  }

  const connections = await listTeamGmailConnections();
  if (connections.length === 0) {
    return {
      communications: [],
      warning: "Niciun coleg nu are Gmail conectat încă.",
    };
  }

  const results = await Promise.all(
    connections.map(async (connection) => {
      try {
        const accessToken = await getValidGmailAccessToken(connection);
        const messageIds = await searchGmailMessages(accessToken, query);
        const messages = await Promise.all(
          messageIds.map(async (messageId) => {
            const message = await getGmailMessage(accessToken, messageId);
            return parseGmailMessage(message, connection.google_email);
          }),
        );
        return messages;
      } catch {
        return [];
      }
    }),
  );

  const communications = results
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { communications };
}
