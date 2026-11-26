import { formatDay } from '../schedule/date';
import { membersWith } from '../schedule/selectors';
import type { IsoDate, Roster } from '../schedule/types';
import { MarkList, type Marking } from './MarkList';
import { PersonChip } from './PersonChip';

interface CleaningListProps {
  readonly roster: Roster;
  readonly today: IsoDate;
  readonly marking: Marking | null;
}

export const CleaningList = ({ roster, today, marking }: CleaningListProps) => (
  <section className="card">
    <h2>Генеральне прибирання</h2>
    <ol className="cleaning">
      {roster.rows.map((row) => {
        const groups = membersWith(roster, row, 'assigned', 'done', 'suggested');
        return (
          <li key={row.date} className={row.date < today ? 'past' : undefined}>
            <time dateTime={row.date}>{formatDay(row.date)}</time>
            <div className="chips">
              {groups.map(({ name, index }) => (
                <PersonChip key={name} name={name} index={index} mark={row.marks[index]} />
              ))}
              {groups.length === 0 && <span className="hint">Не призначено</span>}
            </div>
            {marking && row.date <= today && <MarkList roster={roster} row={row} {...marking} />}
          </li>
        );
      })}
    </ol>
  </section>
);
