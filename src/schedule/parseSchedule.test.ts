import { describe, expect, it } from 'vitest';
import { parseSheetDate } from './date';
import { parseSchedule } from './parseSchedule';
import { buildSample } from './sample';
import { balances } from './selectors';

const tsv = (...rows: string[][]): string => rows.map((row) => row.join('\t')).join('\r\n');

const expectOk = (text: string) => {
  const result = parseSchedule(text);
  if (!result.ok) throw new Error(result.errors.join('; '));
  return result.schedule;
};

const errorsOf = (text: string): string => {
  const result = parseSchedule(text);
  return result.ok ? '' : result.errors.join('\n');
};

describe('parseSchedule', () => {
  it('reads both tables, skipping the title row and blank rows', () => {
    const { daily, cleaning } = expectOk(
      tsv(
        ['Графік чергування'],
        ['Дата', 'Оля', 'Макс', '', 'Дата', 'Оля Макс', 'Іра Юля'],
        ['26.11.2026', 'ч', 'X', '', '25.11.2026', '✓', ''],
        ['27.11.2026', '', '✓', '', '02.12.2026', '', 'Ч'],
        ['', '', '', '', '', '', ''],
      ),
    );
    expect(daily.members).toEqual(['Оля', 'Макс']);
    expect(daily.rows.map((row) => row.marks)).toEqual([
      ['assigned', 'away'],
      [null, 'done'],
    ]);
    expect(cleaning?.members).toEqual(['Оля Макс', 'Іра Юля']);
    expect(cleaning?.rows).toHaveLength(2);
  });

  it('accepts an empty grid without a cleaning table', () => {
    const { cleaning } = expectOk(tsv(['Дата', 'Оля'], ['26.11.2026', ''], ['27.11.2026', '']));
    expect(cleaning).toBeNull();
  });

  it('reads checkboxes, ignoring unchecked ones on rows without a date', () => {
    const { daily } = expectOk(
      tsv(['Дата', 'Оля', 'Макс'], ['26.11.2026', 'TRUE', 'FALSE'], ['', 'FALSE', 'false']),
    );
    expect(daily.rows.map((row) => row.marks)).toEqual([['done', null]]);
  });

  it('rejects a ticked checkbox on a row without a date', () => {
    expect(errorsOf(tsv(['Дата', 'Оля'], ['26.11.2026', ''], ['', 'TRUE']))).toContain('Рядок 3');
  });

  it('reads the CSV export, including its leading blank row', () => {
    const result = parseSchedule(
      ',,,\r\nДата,Оля,,Дата,"Оля, Макс"\r\n26.11.2026,FALSE,,09.09.2026,TRUE\r\n27.11.2026,,,16.09.2026,FALSE',
      ',',
    );
    expect(result.ok && result.schedule.cleaning?.members).toEqual(['Оля, Макс']);
  });

  it('flattens quoted multi-line headers', () => {
    const { daily } = expectOk('Дата\t"Оля\nМакс"\n26.11.2026\tЧ');
    expect(daily.members).toEqual(['Оля Макс']);
  });

  it.each([
    ['unknown mark', tsv(['Дата', 'Оля'], ['26.11.2026', '?']), 'B2'],
    ['impossible date', tsv(['Дата', 'Оля'], ['31.02.2026', '']), 'A2'],
    ['duplicate date', tsv(['Дата', 'Оля'], ['26.11.2026', ''], ['26.11.2026', '']), 'повторюється'],
    ['duplicate name', tsv(['Дата', 'Оля', 'оля'], ['26.11.2026', '', '']), 'повторюються'],
    ['mark without date', tsv(['Дата', 'Оля'], ['26.11.2026', ''], ['', 'Ч']), 'Рядок 3'],
    ['missing header', 'щось інше', '«Дата»'],
    ['empty input', '  ', 'Встав'],
  ])('rejects %s', (_, text, expected) => {
    expect(errorsOf(text)).toContain(expected);
  });

  it('parses the bundled sample and counts duties', () => {
    const { daily, cleaning } = expectOk(buildSample('2026-11-27'));
    expect(cleaning?.rows).toHaveLength(6);
    const total = balances(daily).reduce((sum, item) => sum + item.done + item.planned, 0);
    expect(total).toBe(daily.rows.length);
  });
});

describe('parseSheetDate', () => {
  it('validates leap days', () => {
    expect(parseSheetDate('29.02.2028')).toBe('2028-02-29');
    expect(parseSheetDate('29.02.2027')).toBeNull();
  });
});
