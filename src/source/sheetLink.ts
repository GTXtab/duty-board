const SHEETS_HOST = 'docs.google.com';
const SHEET_PATH = /^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})(?:\/|$)/;
const GID = /(?:^|[?#&])gid=(\d+)/;

/**
 * Builds the CSV export address from a sharing link. The address is reconstructed rather than
 * reused, so the app never requests anything but a Google spreadsheet.
 */
export const toCsvExportUrl = (link: string): string | null => {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== SHEETS_HOST) return null;

  const id = SHEET_PATH.exec(url.pathname)?.[1];
  if (!id) return null;

  const gid = GID.exec(url.hash)?.[1] ?? GID.exec(url.search)?.[1];
  const exportUrl = `https://${SHEETS_HOST}/spreadsheets/d/${id}/export?format=csv`;
  // Without a gid Google exports the first sheet, whose id is not necessarily 0.
  return gid === undefined ? exportUrl : `${exportUrl}&gid=${gid}`;
};

/** Drive adds `rtpof=true` to links of Office files, which have no CSV export. */
export const isOfficeFileLink = (link: string): boolean => /[?&]rtpof=true(?:&|#|$)/.test(link);
