export interface Session {
  readonly token: string;
  readonly expiresAt: number;
}

const KEY = 'duty-board:google-session';
/** A token about to expire would fail in the middle of an action. */
const MARGIN_MS = 60_000;

export const createSession = (token: string, lifetimeSeconds: number, now: number): Session => ({
  token,
  expiresAt: now + lifetimeSeconds * 1000 - MARGIN_MS,
});

const decode = (raw: string): Session | null => {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== 'object' || value === null) return null;
  if (!('token' in value) || typeof value.token !== 'string') return null;
  if (!('expiresAt' in value) || typeof value.expiresAt !== 'number') return null;
  return { token: value.token, expiresAt: value.expiresAt };
};

// `sessionStorage` keeps the token across reloads but drops it with the tab.
export const writeSession = (session: Session | null): void => {
  try {
    if (session) window.sessionStorage.setItem(KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Without storage the sign-in simply lasts until the next reload.
  }
};

export const readSession = (now: number): Session | null => {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw === null) return null;
    const session = decode(raw);
    if (session && session.expiresAt > now) return session;
    writeSession(null);
    return null;
  } catch {
    return null;
  }
};
