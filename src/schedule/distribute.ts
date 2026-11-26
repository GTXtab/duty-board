import type { IsoDate, Roster } from './types';

/**
 * Fills every free date from today on with the available member who has the fewest duties,
 * then the one who has rested longest. The result depends only on the sheet and the date,
 * so everyone reading the same sheet sees the same plan.
 */
export const distribute = (roster: Roster, today: IsoDate): Roster => {
  const stats = roster.members.map((_, index) => {
    const doneDates = roster.rows
      .filter((row) => row.marks[index] === 'done')
      .map((row) => row.date);
    return {
      index,
      load: doneDates.length,
      lastDuty: doneDates.filter((date) => date < today).at(-1) ?? '',
    };
  });
  let previous: ReadonlySet<number> = new Set();

  const rows = roster.rows.map((row) => {
    const onDuty = stats.filter(({ index }) => row.marks[index] === 'done');

    if (row.date < today) {
      previous = new Set(onDuty.map(({ index }) => index));
      return row;
    }

    for (const person of stats) {
      if (row.marks[person.index] === 'assigned') {
        person.load += 1;
        onDuty.push(person);
      }
    }

    let { marks } = row;
    if (onDuty.length === 0) {
      const available = stats.filter(({ index }) => row.marks[index] === null);
      // Two turns in a row are allowed only when nobody else is around.
      const rested = available.filter(({ index }) => !previous.has(index));
      const [next] = (rested.length > 0 ? rested : available).sort(
        (a, b) => a.load - b.load || a.lastDuty.localeCompare(b.lastDuty) || a.index - b.index,
      );
      if (next) {
        next.load += 1;
        onDuty.push(next);
        marks = row.marks.map((mark, index) => (index === next.index ? 'suggested' : mark));
      }
    }

    for (const person of onDuty) person.lastDuty = row.date;
    previous = new Set(onDuty.map(({ index }) => index));
    return { date: row.date, marks };
  });

  return { members: roster.members, rows };
};
