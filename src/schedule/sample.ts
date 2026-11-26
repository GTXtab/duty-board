import { addDays, weekdayIndex } from './date';
import type { IsoDate } from './types';

const NAMES = ['Оля', 'Макс', 'Іра', 'Тарас', 'Юля'];

const sheetDate = (date: IsoDate): string => date.split('-').reverse().join('.');

/** Fictional data in the same layout a spreadsheet puts on the clipboard. */
export const buildSample = (today: IsoDate): string => {
  const start = addDays(today, -7);
  const header = ['Дата', ...NAMES, '', 'Дата', 'Оля Макс', 'Іра Тарас Юля'];
  const rows = Array.from({ length: 42 }, (_, day) => {
    const date = addDays(start, day);
    const duty = day % NAMES.length;
    const isWeekend = weekdayIndex(date) > 4;
    const marks = NAMES.map((_, i) => {
      if (i === duty) return date < today ? '✓' : 'Ч';
      return isWeekend && (i + day) % 3 === 0 ? 'Х' : '';
    });
    const week = day < 6 ? addDays(start, day * 7) : null;
    const cleaning = week
      ? [sheetDate(week), ...[0, 1].map((g) => (g === day % 2 ? (week < today ? '✓' : 'Ч') : ''))]
      : ['', '', ''];
    return [sheetDate(date), ...marks, '', ...cleaning];
  });
  return [header, ...rows].map((row) => row.join('\t')).join('\n');
};
