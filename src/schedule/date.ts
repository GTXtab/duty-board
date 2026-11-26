import type { IsoDate } from './types';

const DAY_MS = 86_400_000;
const SHEET_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

const isIsoDate = (value: string): value is IsoDate => /^\d{4}-\d{2}-\d{2}$/.test(value);

const fromUtc = (date: Date): IsoDate => {
  const value = date.toISOString().slice(0, 10);
  if (!isIsoDate(value)) throw new RangeError(`Unsupported date: ${value}`);
  return value;
};

// All arithmetic runs in UTC so daylight saving changes cannot shift a calendar day.
const toUtc = (date: IsoDate): Date => new Date(`${date}T00:00:00Z`);

export const parseSheetDate = (value: string): IsoDate | null => {
  const match = SHEET_DATE.exec(value);
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (year < 1000) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal = date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isReal ? fromUtc(date) : null;
};

export const todayIso = (now: Date = new Date()): IsoDate =>
  fromUtc(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));

export const addDays = (date: IsoDate, days: number): IsoDate =>
  fromUtc(new Date(toUtc(date).getTime() + days * DAY_MS));

export const daysBetween = (from: IsoDate, to: IsoDate): number =>
  Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / DAY_MS);

/** Monday is 0, Sunday is 6. */
export const weekdayIndex = (date: IsoDate): number => (toUtc(date).getUTCDay() + 6) % 7;

export const monthKey = (date: IsoDate): string => date.slice(0, 7);

const formatter = (options: Intl.DateTimeFormatOptions) => {
  const format = new Intl.DateTimeFormat('uk-UA', { ...options, timeZone: 'UTC' });
  return (date: IsoDate): string => format.format(toUtc(date));
};

export const formatDay = formatter({ weekday: 'short', day: 'numeric', month: 'long' });
export const formatShort = formatter({ day: '2-digit', month: '2-digit' });
export const formatMonth = formatter({ month: 'long', year: 'numeric' });
