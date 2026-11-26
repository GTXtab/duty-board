import type { Mark, Roster, RosterRow } from './types';

export const membersWith = (
  roster: Roster,
  row: RosterRow,
  ...marks: readonly Mark[]
): readonly { name: string; index: number }[] =>
  roster.members.flatMap((name, index) => {
    const mark = row.marks[index];
    return mark && marks.includes(mark) ? [{ name, index }] : [];
  });

export interface Balance {
  readonly name: string;
  readonly index: number;
  readonly done: number;
  readonly planned: number;
}

export const balances = (roster: Roster): readonly Balance[] =>
  roster.members.map((name, index) => {
    const count = (mark: Mark): number =>
      roster.rows.filter((row) => row.marks[index] === mark).length;
    return { name, index, done: count('done'), planned: count('assigned') + count('suggested') };
  });
