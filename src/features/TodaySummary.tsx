import { addDays, formatDay } from '../schedule/date';
import { membersWith } from '../schedule/selectors';
import type { IsoDate, Roster, RosterRow } from '../schedule/types';
import { personStyle } from './personStyle';

interface DutyCardProps {
  readonly title: string;
  readonly roster: Roster;
  readonly row: RosterRow | undefined;
  readonly emptyText: string;
  readonly isHero?: boolean;
}

const DutyCard = ({ title, roster, row, emptyText, isHero = false }: DutyCardProps) => {
  const people = row ? membersWith(roster, row, 'assigned', 'done', 'suggested') : [];
  const [lead] = people;
  const isDone = people.length > 0 && people.every(({ index }) => row?.marks[index] === 'done');
  return (
    <article
      className={isHero ? 'card hero' : 'card next'}
      style={isHero && lead ? personStyle(lead.index) : undefined}
    >
      <header>
        <h2>{title}</h2>
        {row && <p className="hint">{formatDay(row.date)}</p>}
      </header>
      <p className="who">
        {people.length > 0 ? people.map(({ name }) => name).join(', ') : emptyText}
      </p>
      {isHero && people.length > 0 && (
        <p className={isDone ? 'state done' : 'state'}>{isDone ? '✓ Виконано' : 'Ще не відмічено'}</p>
      )}
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
  const todayRow = rowOn(today);
  const tomorrowRow = rowOn(addDays(today, 1));
  const nextCleaning = cleaning?.rows.find((row) => row.date >= today);
  const describe = (row: RosterRow | undefined) => (row ? 'Не призначено' : 'Дати немає в таблиці');

  return (
    <section className="summary">
      <DutyCard
        isHero
        title="Сьогодні чергує"
        roster={daily}
        row={todayRow}
        emptyText={describe(todayRow)}
      />
      <DutyCard title="Завтра" roster={daily} row={tomorrowRow} emptyText={describe(tomorrowRow)} />
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
