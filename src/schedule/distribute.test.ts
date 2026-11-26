import { describe, expect, it } from 'vitest';
import { distribute } from './distribute';
import type { IsoDate, Mark, Roster } from './types';

const TODAY: IsoDate = '2026-11-10';

const roster = (members: string[], ...rows: [IsoDate, ...(Mark | null)[]][]): Roster => ({
  members,
  dateColumn: 0,
  rows: rows.map(([date, ...marks], line) => ({ date, line, marks })),
});

const plan = (input: Roster): (string | null)[] =>
  distribute(input, TODAY).rows.map((row) => {
    const index = row.marks.findIndex((mark) => mark === 'suggested');
    return input.members[index] ?? null;
  });

const free = (day: 10 | 11 | 12 | 13 | 14 | 15, count: number): [IsoDate, ...null[]] => [
  `2026-11-${day}`,
  ...Array<null>(count).fill(null),
];

describe('distribute', () => {
  it('assigns nobody on covered days and carries the queue over', () => {
    const input = roster(['A', 'B'], free(10, 2), free(11, 2), free(12, 2));
    const rows = distribute(input, TODAY, new Set<IsoDate>(['2026-11-11'])).rows;
    expect(rows.map((row) => row.marks)).toEqual([
      ['suggested', null],
      [null, null],
      [null, 'suggested'],
    ]);
  });

  it('rotates evenly when nobody has served yet', () => {
    const input = roster(['A', 'B', 'C'], ...([10, 11, 12, 13, 14, 15] as const).map((d) => free(d, 3)));
    expect(plan(input)).toEqual(['A', 'B', 'C', 'A', 'B', 'C']);
  });

  it('prefers those who have served less', () => {
    const input = roster(
      ['A', 'B'],
      ['2026-11-07', 'done', null],
      ['2026-11-08', 'done', null],
      free(10, 2),
      free(11, 2),
      free(12, 2),
    );
    expect(plan(input)).toEqual([null, null, 'B', 'A', 'B']);
  });

  it('skips people who are away and leaves a day empty when everyone left', () => {
    const input = roster(
      ['A', 'B'],
      ['2026-11-10', 'away', null],
      ['2026-11-11', 'away', null],
      ['2026-11-12', 'away', 'away'],
    );
    expect(plan(input)).toEqual(['B', 'B', null]);
  });

  it('does not give yesterday’s person another turn', () => {
    const input = roster(
      ['A', 'B'],
      ['2026-11-07', null, 'done'],
      ['2026-11-08', null, 'done'],
      ['2026-11-09', 'done', null],
      free(10, 2),
    );
    expect(plan(input).at(-1)).toBe('B');
  });

  it('keeps manual and completed duties and counts them', () => {
    const input = roster(
      ['A', 'B'],
      ['2026-11-10', 'assigned', null],
      ['2026-11-11', null, null],
      ['2026-11-12', null, 'done'],
    );
    expect(plan(input)).toEqual([null, 'B', null]);
  });

  it('never plans the past', () => {
    expect(plan(roster(['A'], ['2026-11-09', null]))).toEqual([null]);
  });
});
