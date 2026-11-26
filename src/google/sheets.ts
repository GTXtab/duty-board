import { columnName, parseTable } from '../schedule/parseSchedule';
import type { IsoDate } from '../schedule/types';
import type { SheetRef } from '../source/sheetLink';
import { googleRequest, isRecord } from './api';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface DutyMark {
  readonly roster: 'daily' | 'cleaning';
  readonly date: IsoDate;
  readonly member: string;
  readonly done: boolean;
}

/** A message that is safe and useful to show to the person. */
export class SheetWriteError extends Error {}

const readTitle = (body: unknown, gid: string | null): string => {
  const sheets: unknown[] =
    isRecord(body) && 'sheets' in body && Array.isArray(body.sheets) ? body.sheets : [];
  for (const sheet of sheets) {
    if (!isRecord(sheet) || !('properties' in sheet) || !isRecord(sheet.properties)) continue;
    const { properties } = sheet;
    if (!('title' in properties) || typeof properties.title !== 'string') continue;
    // Google omits `sheetId` when it is 0.
    const id = 'sheetId' in properties ? String(properties.sheetId) : '0';
    if (gid === null || id === gid) return properties.title;
  }
  throw new SheetWriteError('Аркуш із посилання не знайдено.');
};

const readValues = (body: unknown): string[][] => {
  if (!isRecord(body) || !('values' in body) || !Array.isArray(body.values)) return [];
  return body.values.map((row: unknown) =>
    Array.isArray(row) ? row.map((cell: unknown) => String(cell).replace(/\s+/g, ' ').trim()) : [],
  );
};

export const writeDutyMark = async (token: string, ref: SheetRef, mark: DutyMark): Promise<void> => {
  const base = `${API}/${encodeURIComponent(ref.id)}`;
  const meta = await googleRequest(token, `${base}?fields=sheets.properties(sheetId,title)`);
  const sheet = `'${readTitle(meta, ref.gid).replaceAll("'", "''")}'`;

  // The cell is located in fresh data, so rows moved since the page loaded are not overwritten.
  const values = readValues(
    await googleRequest(token, `${base}/values/${encodeURIComponent(sheet)}`),
  );
  const parsed = parseTable(values);
  const roster = parsed.ok ? parsed.schedule[mark.roster] : null;
  const row = roster?.rows.find((candidate) => candidate.date === mark.date);
  const index = roster?.members.indexOf(mark.member) ?? -1;
  if (!roster || !row || index === -1) {
    throw new SheetWriteError('Таблиця змінилася: онови сторінку й спробуй ще раз.');
  }
  if (row.marks[index] === 'away') {
    throw new SheetWriteError('У клітинці стоїть Х. Спершу прибери його в таблиці.');
  }

  const column = roster.dateColumn + 1 + index;
  const current = values[row.line]?.[column]?.toLowerCase();
  const isCheckbox = current === 'true' || current === 'false';
  const value = isCheckbox ? mark.done : mark.done ? '✓' : '';
  const range = encodeURIComponent(`${sheet}!${columnName(column)}${row.line + 1}`);

  await googleRequest(token, `${base}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    body: { values: [[value]] },
  });
};
