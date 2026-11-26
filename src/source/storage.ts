export type SavedSource =
  | { readonly kind: 'paste'; readonly text: string }
  | { readonly kind: 'link'; readonly text: string; readonly link: string; readonly fetchedAt: number };

const KEY = 'duty-board:source';
/** Written by the paste-only version; still read so saved schedules survive the upgrade. */
const LEGACY_KEY = 'duty-board:sheet';

const decode = (raw: string): SavedSource | null => {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== 'object' || value === null) return null;
  if (!('kind' in value) || !('text' in value) || typeof value.text !== 'string') return null;
  if (value.kind === 'paste') return { kind: 'paste', text: value.text };
  if (
    value.kind === 'link' &&
    'link' in value &&
    typeof value.link === 'string' &&
    'fetchedAt' in value &&
    typeof value.fetchedAt === 'number'
  ) {
    return { kind: 'link', text: value.text, link: value.link, fetchedAt: value.fetchedAt };
  }
  return null;
};

// Storage can be unavailable (private mode, blocked site data); the app still works without it.
export const readSource = (): SavedSource | null => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== null) return decode(raw);
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    return legacy === null ? null : { kind: 'paste', text: legacy };
  } catch {
    return null;
  }
};

export const writeSource = (source: SavedSource | null): boolean => {
  try {
    window.localStorage.removeItem(LEGACY_KEY);
    if (source === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(source));
    return true;
  } catch {
    return false;
  }
};
