const SHEETS_HOST = 'docs.google.com';
const SHEET_PATH = /^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})(?:\/|$)/;
const GID = /(?:^|[?#&])gid=(\d+)/;

export interface SheetRef {
  readonly id: string;
  /** `null` means the first sheet, whose id is not necessarily 0. */
  readonly gid: string | null;
}

export const parseSheetLink = (link: string): SheetRef | null => {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== SHEETS_HOST) return null;

  const id = SHEET_PATH.exec(url.pathname)?.[1];
  if (!id) return null;

  return { id, gid: GID.exec(url.hash)?.[1] ?? GID.exec(url.search)?.[1] ?? null };
};

/**
 * The address is reconstructed rather than reused, so the app never requests anything but a
 * Google spreadsheet.
 */
export const toCsvExportUrl = (link: string): string | null => {
  const ref = parseSheetLink(link);
  if (!ref) return null;
  const exportUrl = `https://${SHEETS_HOST}/spreadsheets/d/${ref.id}/export?format=csv`;
  return ref.gid === null ? exportUrl : `${exportUrl}&gid=${ref.gid}`;
};

/** Drive adds `rtpof=true` to links of Office files, which have no CSV export. */
export const isOfficeFileLink = (link: string): boolean => /[?&]rtpof=true(?:&|#|$)/.test(link);
