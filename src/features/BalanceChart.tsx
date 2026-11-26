import { balances } from '../schedule/selectors';
import type { Roster } from '../schedule/types';
import { personStyle } from './personStyle';

export const BalanceChart = ({ roster }: { readonly roster: Roster }) => {
  const items = balances(roster);
  const max = Math.max(1, ...items.map((item) => item.done + item.planned));
  const percent = (value: number): string => `${(value / max) * 100}%`;

  return (
    <section className="card">
      <h2>Баланс щоденних чергувань</h2>
      <p className="hint">Суцільна смуга — відчергував, світла — заплановано. Пунктирні імена в графіку призначені автоматично.</p>
      <ul className="balance">
        {items.map(({ name, index, done, planned }) => (
          <li key={name} style={personStyle(index)}>
            <span>{name}</span>
            <span className="track" aria-hidden="true">
              <span className="bar" style={{ '--share': percent(done) }} />
              <span className="bar planned" style={{ '--share': percent(planned) }} />
            </span>
            <span aria-label={`відчергував ${done}, заплановано ${planned}`}>
              {done} + {planned}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
