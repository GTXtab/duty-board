import { daysBetween, parseSheetDate } from './date';
import { parseDelimited, type Delimiter } from './delimited';
import type { IsoDate, Mark, ParseResult, Roster, RosterRow } from './types';

export const MAX_INPUT_LENGTH = 200_000;
const MAX_ERRORS = 8;
const DATE_HEADER = 'дата';

const MARKS: ReadonlyMap<string, Mark> = new Map<string, Mark>([
  ['х', 'away'],
  // Latin look-alike: easy to type by accident with the wrong keyboard layout.
  ['x', 'away'],
  ['ч', 'assigned'],
  ['✓', 'done'],
  ['✔', 'done'],
  // A ticked spreadsheet checkbox is copied as plain text.
  ['true', 'done'],
]);

const UNCHECKED = 'false';

const isDateHeader = (cell: string): boolean => cell.toLowerCase() === DATE_HEADER;

export const columnName = (index: number): string => {
  const letter = String.fromCharCode(65 + (index % 26));
  return index < 26 ? letter : columnName(Math.floor(index / 26) - 1) + letter;
};

const readMembers = (header: readonly string[], dateColumn: number): string[] => {
  const members: string[] = [];
  for (const cell of header.slice(dateColumn + 1)) {
    if (cell === '' || isDateHeader(cell)) break;
    members.push(cell);
  }
  return members;
};

const readRoster = (
  table: readonly (readonly string[])[],
  headerIndex: number,
  dateColumn: number,
  errors: string[],
): Roster => {
  const members = readMembers(table[headerIndex] ?? [], dateColumn);
  const address = (column: number, rowIndex: number): string =>
    `${columnName(column)}${rowIndex + 1}`;

  if (members.length === 0) {
    errors.push(`Праворуч від «Дата» (${address(dateColumn, headerIndex)}) немає імен.`);
  }
  if (new Set(members.map((name) => name.toLowerCase())).size !== members.length) {
    errors.push(`Імена в шапці біля ${address(dateColumn, headerIndex)} повторюються.`);
  }

  const rows: RosterRow[] = [];
  const seen = new Set<IsoDate>();

  table.slice(headerIndex + 1).forEach((cells, offset) => {
    const rowIndex = headerIndex + 1 + offset;
    const rawDate = cells[dateColumn] ?? '';
    // Unchecked boxes often extend past the last date, so they must count as empty.
    const rawMarks = members.map((_, i) => {
      const value = cells[dateColumn + 1 + i] ?? '';
      return value.toLowerCase() === UNCHECKED ? '' : value;
    });

    if (rawDate === '') {
      if (rawMarks.some((value) => value !== '')) {
        errors.push(`Рядок ${rowIndex + 1}: є позначки, але немає дати.`);
      }
      return;
    }

    const date = parseSheetDate(rawDate);
    if (!date) {
      errors.push(`${address(dateColumn, rowIndex)}: «${rawDate}» не є датою формату ДД.ММ.РРРР.`);
      return;
    }
    if (seen.has(date)) {
      errors.push(`${address(dateColumn, rowIndex)}: дата ${rawDate} повторюється.`);
      return;
    }
    seen.add(date);

    const marks = rawMarks.map((value, i) => {
      if (value === '') return null;
      const mark = MARKS.get(value.toLowerCase());
      if (!mark) {
        errors.push(
          `${address(dateColumn + 1 + i, rowIndex)}: невідома позначка «${value}». Дозволені Х, Ч, ✓ або чекбокс.`,
        );
      }
      return mark ?? null;
    });
    rows.push({ date, line: rowIndex, marks });
  });

  if (rows.length === 0) {
    errors.push(`Під «Дата» (${address(dateColumn, headerIndex)}) немає жодної дати.`);
  }

  return { members, dateColumn, rows: rows.sort((a, b) => a.date.localeCompare(b.date)) };
};

/** Cleaning tables are recognised by their dates never being on consecutive days. */
const isPeriodic = ({ rows }: Roster): boolean =>
  rows.length > 1 &&
  rows.every((row, i) => {
    const previous = rows[i - 1];
    return !previous || daysBetween(previous.date, row.date) > 1;
  });

const fail = (errors: readonly string[]): ParseResult => ({
  ok: false,
  errors:
    errors.length > MAX_ERRORS
      ? [...errors.slice(0, MAX_ERRORS), `Ще помилок: ${errors.length - MAX_ERRORS}.`]
      : errors,
});

export const parseTable = (table: readonly (readonly string[])[]): ParseResult => {
  const headerIndex = table.findIndex((row) => row.some(isDateHeader));
  if (headerIndex === -1) {
    return fail(['Не знайдено колонку «Дата». Копіюй клітинки разом із шапкою.']);
  }

  const errors: string[] = [];
  const rosters = (table[headerIndex] ?? []).flatMap((cell, column) =>
    isDateHeader(cell) ? [readRoster(table, headerIndex, column, errors)] : [],
  );
  if (errors.length > 0) return fail(errors);

  const daily = rosters.filter((roster) => !isPeriodic(roster));
  const cleaning = rosters.filter(isPeriodic);
  const [dailyRoster] = daily;

  if (!dailyRoster || daily.length > 1 || cleaning.length > 1) {
    return fail([
      'Потрібна одна щоденна таблиця (дати поспіль) і не більше однієї таблиці прибирання (дати з проміжками).',
    ]);
  }

  return { ok: true, schedule: { daily: dailyRoster, cleaning: cleaning[0] ?? null } };
};

export const parseSchedule = (text: string, delimiter: Delimiter = '\t'): ParseResult => {
  if (text.trim() === '') return fail(['Встав скопійовану таблицю.']);
  if (text.length > MAX_INPUT_LENGTH) return fail(['Забагато даних. Скопіюй лише аркуш графіка.']);
  return parseTable(parseDelimited(text, delimiter));
};
