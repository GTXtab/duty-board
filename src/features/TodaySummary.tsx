import { addDays, formatDay } from '../schedule/date';
import { membersWith } from '../schedule/selectors';
import type { IsoDate, Roster, RosterRow } from '../schedule/types';
import { PersonChip } from './PersonChip';

interface DutyCardProps {
  readonly title: string;
  readonly roster: Roster;
  readonly row: RosterRow | undefined;
  readonly emptyText: string;
}

const DutyCard = ({ title, roster, row, emptyText }: DutyCardProps) => {
  const people = row ? membersWith(roster, row, 'assigned', 'done', 'suggested') : [];
  return (
    <article className="card">
      <h2>{title}</h2>
      {row && <p className="hint">{formatDay(row.date)}</p>}
      <div className="chips large">
        {people.map(({ name, index }) => (
          <PersonChip key={name} name={name} index={index} mark={row?.marks[index]} />
        ))}
        {people.length === 0 && <span className="hint">{emptyText}</span>}
      </div>
    </article>
  );
};

interface TodaySummaryProps {
  readonly daily: Roster;
  readonly cleaning: Roster | null;
  readonly today: IsoDate;
}

export const TodaySummary = ({ daily, cleaning, today }: TodaySummaryProps) => {
  const rowOn = (date: IsoDate) => daily.rows.find((row) => row.date === date);
  const nextCleaning = cleaning?.rows.find((row) => row.date >= today);
  const describe = (row: RosterRow | undefined) => (row ? 'Не призначено' : 'Дати немає в таблиці');

  return (
    <section className="summary">
      {[
        { title: 'Сьогодні', row: rowOn(today) },
        { title: 'Завтра', row: rowOn(addDays(today, 1)) },
      ].map(({ title, row }) => (
        <DutyCard key={title} title={title} roster={daily} row={row} emptyText={describe(row)} />
      ))}
      {cleaning && (
        <DutyCard
          title="Найближче прибирання"
          roster={cleaning}
          row={nextCleaning}
          emptyText={nextCleaning ? 'Не призначено' : 'Майбутніх дат немає'}
        />
      )}
    </section>
  );
};
