import { readApiErrorMessage } from "./api-error";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://sales-pipeline-api-one.vercel.app"
    : "http://localhost:4000");

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const message = await readApiErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/** Start OAuth via authenticated POST — no tokens in URLs. */
export async function startOAuthConnect(
  service: string,
  token: string,
): Promise<string> {
  const result = await apiFetch<{ url: string }>("/auth/connect/start", {
    method: "POST",
    body: JSON.stringify({ service }),
    token,
  });
  return result.url;
}

/** @deprecated Use startOAuthConnect instead. */
export function getConnectUrl(service: string, token: string): string {
  void service;
  void token;
  throw new Error("Use startOAuthConnect() instead of getConnectUrl()");
}
