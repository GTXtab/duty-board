import { useState } from 'react';

const MEMBER_KEY = 'duty-board:member';

const readMember = (): string => {
  try {
    return window.localStorage.getItem(MEMBER_KEY) ?? '';
  } catch {
    return '';
  }
};

const rememberMember = (member: string): void => {
  try {
    window.localStorage.setItem(MEMBER_KEY, member);
  } catch {
    // The choice is a convenience; without storage it is simply asked again.
  }
};

interface GooglePanelProps {
  readonly members: readonly string[];
  readonly isReady: boolean;
  readonly isSignedIn: boolean;
  readonly isBusy: boolean;
  readonly canMark: boolean;
  readonly message: string | null;
  readonly onSignIn: () => void;
  readonly onSignOut: () => void;
  readonly onSync: (member: string) => void;
}

export const GooglePanel = (props: GooglePanelProps) => {
  const [stored, setStored] = useState(readMember);
  const member = props.members.includes(stored) ? stored : '';

  return (
    <section className="card">
      <h2>Google</h2>
      {props.isSignedIn ? (
        <div className="actions">
          <select
            aria-label="Твоє прізвище"
            value={member}
            onChange={(event) => {
              setStored(event.target.value);
              rememberMember(event.target.value);
            }}
          >
            <option value="">Обери себе</option>
            {props.members.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={props.isBusy || member === ''}
            onClick={() => props.onSync(member)}
          >
            Додати мої чергування в календар
          </button>
          <button type="button" className="secondary" onClick={props.onSignOut}>
            Вийти
          </button>
        </div>
      ) : (
        <div className="actions">
          <button type="button" disabled={!props.isReady} onClick={props.onSignIn}>
            Увійти через Google
          </button>
          <p className="hint">Щоб ставити галочки та додати чергування в календар.</p>
        </div>
      )}
      {props.isSignedIn && !props.canMark && (
        <p className="hint">Галочки доступні лише для таблиці, підключеної за посиланням.</p>
      )}
      {props.message && (
        <p className="hint" role="status">
          {props.message}
        </p>
      )}
    </section>
  );
};
