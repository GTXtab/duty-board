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

// Keeps the upcoming week visible when past weeks fill the scrollable list.
const revealInList = (item: HTMLLIElement | null): void => {
  const list = item?.parentElement;
  if (item && list) list.scrollTop = item.offsetTop - list.offsetTop;
};

export const CleaningList = ({ roster, today, marking }: CleaningListProps) => {
  const next = roster.rows.find((row) => row.date >= today)?.date;
  return (
  <section className="card">
    <h2>Генеральне прибирання</h2>
    <ol className="cleaning">
      {roster.rows.map((row) => {
        const groups = membersWith(roster, row, 'assigned', 'done', 'suggested');
        return (
          <li key={row.date} ref={row.date === next ? revealInList : undefined} className={row.date < today ? 'past' : row.date === next ? 'next-up' : undefined}>
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
};
