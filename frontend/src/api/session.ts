/**
 * Centralised session storage.
 *
 * Stored in `localStorage` so a page refresh keeps the user signed in. For a
 * small internal tool with HTTPS-only origins this is a reasonable trade-off;
 * for a public app we'd want HTTP-only cookies instead.
 */

const TOKEN_KEY = "i3.access_token";
const EMAIL_KEY = "i3.email";
const EXPIRES_KEY = "i3.token_expires_at_ms"; // ms-since-epoch for cheap client-side expiry check

export interface Session {
  token: string;
  email: string;
  expiresAtMs: number;
}

export function saveSession(token: string, email: string, expiresInSeconds: number): void {
  const expiresAtMs = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  localStorage.setItem(EXPIRES_KEY, String(expiresAtMs));
}

export function getSession(): Session | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const email = localStorage.getItem(EMAIL_KEY);
  const expiresAtMs = Number(localStorage.getItem(EXPIRES_KEY) || 0);
  if (!token || !email || !expiresAtMs) return null;
  // 30-second skew so we don't try to use a token that's about to expire mid-flight
  if (expiresAtMs <= Date.now() + 30_000) return null;
  return { token, email, expiresAtMs };
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

/** Fired by the axios 401 interceptor and listened to by App.tsx. */
export const UNAUTHORIZED_EVENT = "i3:unauthorized";

export function emitUnauthorized(): void {
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
}
