import type { Roster, RosterRow } from '../schedule/types';

export interface Marking {
  readonly isBusy: boolean;
  readonly onToggle: (row: RosterRow, member: string, done: boolean) => void;
}

interface MarkListProps extends Marking {
  readonly roster: Roster;
  readonly row: RosterRow;
}

export const MarkList = ({ roster, row, isBusy, onToggle }: MarkListProps) => (
  // A shared name lets the browser keep only one list open.
  <details className="marks" name="marks">
    <summary>Відмітити</summary>
    <div className="options">
      {roster.members.map((name, index) => (
        <label key={name}>
          <input
            type="checkbox"
            checked={row.marks[index] === 'done'}
            disabled={isBusy || row.marks[index] === 'away'}
            onChange={(event) => onToggle(row, name, event.target.checked)}
          />
          {name}
        </label>
      ))}
    </div>
  </details>
);
