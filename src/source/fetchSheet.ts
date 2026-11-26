import { isOfficeFileLink, toCsvExportUrl } from './sheetLink';

const TIMEOUT_MS = 15_000;

export type FetchResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: string };

const UNREACHABLE =
  'Не вдалося прочитати таблицю. Перевір інтернет і доступ «Усі, хто має посилання: переглядач».';

const OFFICE_FILE =
  'Це файл Excel, а не Google Таблиця. Відкрий його, обери «Файл → Зберегти як Google Таблиці» та встав нове посилання.';

export const fetchSheet = async (link: string, signal: AbortSignal): Promise<FetchResult> => {
  const url = toCsvExportUrl(link);
  if (!url) {
    return { ok: false, error: 'Потрібне посилання виду https://docs.google.com/spreadsheets/d/…' };
  }
  const failure: FetchResult = {
    ok: false,
    error: isOfficeFileLink(link) ? OFFICE_FILE : UNREACHABLE,
  };
  try {
    const response = await fetch(url, {
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
    });
    // A private sheet may answer with a sign-in page instead of an error status.
    const isCsv = response.headers.get('content-type')?.startsWith('text/csv') ?? false;
    if (!response.ok || !isCsv) return failure;
    return { ok: true, text: await response.text() };
  } catch {
    return failure;
  }
};
