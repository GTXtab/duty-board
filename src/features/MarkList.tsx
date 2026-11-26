import type { MarkAction } from '../google/sheets';
import type { IsoDate, Roster, RosterRow } from '../schedule/types';

export interface Marking {
  readonly isBusy: boolean;
  readonly onMark: (row: RosterRow, member: string, action: MarkAction) => void;
}

interface MarkListProps extends Marking {
  readonly roster: Roster;
  readonly row: RosterRow;
  readonly today: IsoDate;
}

export const MarkList = ({ roster, row, today, isBusy, onMark }: MarkListProps) => {
  const canTick = row.date <= today;
  const canLeave = row.date >= today;
  return (
    // A shared name lets the browser keep only one list open.
    <details className="marks" name="marks">
      <summary>{canTick ? 'Відмітити' : 'Кого не буде'}</summary>
      <div className="options">
        {roster.members.map((name, index) => {
          const mark = row.marks[index];
          const isAway = mark === 'away';
          return (
            <div key={name} className="mark-row">
              {canTick ? (
                <label>
                  <input
                    type="checkbox"
                    checked={mark === 'done'}
                    disabled={isBusy || isAway}
                    onChange={(event) =>
                      onMark(row, name, event.target.checked ? 'done' : 'undone')
                    }
                  />
                  {name}
                </label>
              ) : (
                <span className={isAway ? 'name gone' : 'name'}>{name}</span>
              )}
              {canLeave && mark !== 'done' && (
                <button
                  type="button"
                  className="secondary"
                  aria-label={isAway ? `Повернути: ${name}` : `Немає в гуртожитку: ${name}`}
                  disabled={isBusy}
                  onClick={() => onMark(row, name, isAway ? 'back' : 'away')}
                >
                  {isAway ? 'Повернути' : 'Немає'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
};
