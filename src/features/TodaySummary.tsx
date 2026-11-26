import { addDays, formatDay } from '../schedule/date';
import { membersWith } from '../schedule/selectors';
import type { IsoDate, Roster, RosterRow } from '../schedule/types';
import type { Marking } from './MarkList';
import { personStyle } from './personStyle';

interface DutyCardProps {
  readonly title: string;
  readonly roster: Roster;
  readonly row: RosterRow | undefined;
  readonly emptyText: string;
  readonly isHero?: boolean;
  readonly marking?: Marking | null;
}

const DutyCard = ({
  title,
  roster,
  row,
  emptyText,
  isHero = false,
  marking = null,
}: DutyCardProps) => {
  const people = row ? membersWith(roster, row, 'assigned', 'done', 'suggested') : [];
  const [lead] = people;
  const away = row && isHero ? membersWith(roster, row, 'away') : [];
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
      {marking && row && (
        <div className="leave">
          {people
            .filter(({ index }) => row.marks[index] !== 'done')
            .map(({ name }) => (
              <button
                key={name}
                type="button"
                className="secondary"
                disabled={marking.isBusy}
                onClick={() => marking.onMark(row, name, 'away')}
              >
                {people.length > 1 ? `${name}: немає в гуртожитку` : 'Немає в гуртожитку'}
              </button>
            ))}
        </div>
      )}
      {away.length > 0 && row && (
        <ul className="absent">
          {away.map(({ name }) => (
            <li key={name}>
              Сьогодні немає: {name}
              {marking && (
                <button
                  type="button"
                  className="secondary"
                  aria-label={`Повернути: ${name}`}
                  disabled={marking.isBusy}
                  onClick={() => marking.onMark(row, name, 'back')}
                >
                  Повернути
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

interface TodaySummaryProps {
  readonly daily: Roster;
  readonly cleaning: Roster | null;
  readonly today: IsoDate;
  readonly marking: Marking | null;
}

export const TodaySummary = ({ daily, cleaning, today, marking }: TodaySummaryProps) => {
  const rowOn = (date: IsoDate) => daily.rows.find((row) => row.date === date);
  const todayRow = rowOn(today);
  const tomorrowRow = rowOn(addDays(today, 1));
  const nextCleaning = cleaning?.rows.find((row) => row.date >= today);
  const isCleaningDay = (date: IsoDate) =>
    cleaning?.rows.some((row) => row.date === date) ?? false;
  const describe = (date: IsoDate, row: RosterRow | undefined) => {
    if (isCleaningDay(date)) return 'Генеральне прибирання';
    return row ? 'Не призначено' : 'Дати немає в таблиці';
  };

  return (
    <section className="summary">
      <DutyCard
        isHero
        marking={marking}
        title="Сьогодні чергує"
        roster={daily}
        row={todayRow}
        emptyText={describe(today, todayRow)}
      />
      <DutyCard title="Завтра" roster={daily} row={tomorrowRow} emptyText={describe(addDays(today, 1), tomorrowRow)} />
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
