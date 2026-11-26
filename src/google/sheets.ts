import { columnName, parseTable } from '../schedule/parseSchedule';
import type { IsoDate } from '../schedule/types';
import type { SheetRef } from '../source/sheetLink';
import { googleRequest, isRecord } from './api';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';

export type MarkAction = 'done' | 'undone' | 'away' | 'back';

export interface DutyMark {
  readonly roster: 'daily' | 'cleaning';
  readonly date: IsoDate;
  readonly member: string;
  readonly action: MarkAction;
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
  const current = row.marks[index];
  const isAttendance = mark.action === 'away' || mark.action === 'back';
  if (!isAttendance && current === 'away') {
    throw new SheetWriteError('Цю людину позначено відсутньою. Спершу натисни «Повернути».');
  }
  if (mark.action === 'away' && current === 'done') {
    throw new SheetWriteError('Чергування вже відмічене виконаним. Спершу зніми галочку.');
  }
  // Someone else may have changed the cell already; there is nothing left to undo then.
  if (mark.action === 'back' && current !== 'away') return;

  const column = roster.dateColumn + 1 + index;
  const isCheckbox = (text: string | undefined): boolean => /^(true|false)$/i.test(text ?? '');
  // An away mark replaces the checkbox value, so the rest of the table tells what to restore.
  const usesCheckboxes =
    mark.action === 'back'
      ? roster.rows.some(({ line }) =>
          roster.members.some((_, i) => isCheckbox(values[line]?.[roster.dateColumn + 1 + i])),
        )
      : isCheckbox(values[row.line]?.[column]);
  const cleared = usesCheckboxes ? false : '';
  const written: Record<MarkAction, string | boolean> = {
    done: usesCheckboxes ? true : '✓',
    undone: cleared,
    away: 'Х',
    back: cleared,
  };
  const range = encodeURIComponent(`${sheet}!${columnName(column)}${row.line + 1}`);

  await googleRequest(token, `${base}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT',
    body: { values: [[written[mark.action]]] },
  });
};
