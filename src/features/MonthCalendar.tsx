import { useState } from 'react';
import { formatMonth, formatShort, monthKey, weekdayIndex } from '../schedule/date';
import { membersWith } from '../schedule/selectors';
import type { IsoDate, Roster } from '../schedule/types';
import { MarkList, type Marking } from './MarkList';
import { PersonChip } from './PersonChip';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

interface MonthCalendarProps {
  readonly roster: Roster;
  readonly today: IsoDate;
  readonly cleaningDays: ReadonlySet<IsoDate>;
  readonly marking: Marking | null;
}

export const MonthCalendar = ({
  roster,
  today,
  cleaningDays,
  marking,
}: MonthCalendarProps) => {
  const months = [...new Set(roster.rows.map((row) => monthKey(row.date)))];
  const [position, setPosition] = useState(() => Math.max(months.indexOf(monthKey(today)), 0));
  const [showPast, setShowPast] = useState(false);
  const rows = roster.rows.filter((row) => monthKey(row.date) === months[position]);
  const [first] = rows;
  if (!first) return null;

  return (
    <section className="card">
      <header className="month">
        <button
          type="button"
          className="secondary"
          aria-label="Попередній місяць"
          disabled={position === 0}
          onClick={() => setPosition(position - 1)}
        >
          ‹
        </button>
        <h2>{formatMonth(first.date)}</h2>
        <button
          type="button"
          className="secondary"
          aria-label="Наступний місяць"
          disabled={position === months.length - 1}
          onClick={() => setPosition(position + 1)}
        >
          ›
        </button>
      </header>

      {rows.some((row) => row.date < today) && (
        <button type="button" className="secondary past-toggle" onClick={() => setShowPast(!showPast)}>
          {showPast ? 'Сховати минулі дні' : 'Показати минулі дні'}
        </button>
      )}

      <div className="weekdays" aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <ol className={showPast ? 'calendar show-past' : 'calendar'}>
        {rows.map((row) => {
          const duty = membersWith(roster, row, 'assigned', 'done', 'suggested');
          const away = membersWith(roster, row, 'away');
          const weekday = weekdayIndex(row.date);
          // A mark typed into the sheet by hand still wins over the cleaning day.
          const isCleaningOnly = cleaningDays.has(row.date) && duty.length === 0;
          const classes = [
            'day',
            weekday > 4 && 'weekend',
            row.date === today && 'today',
            row.date < today && 'past',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            // Explicit column keeps weekdays aligned even if the sheet skips dates.
            <li
              key={row.date}
              className={classes}
              style={{ gridColumnStart: weekday + 1 }}
              aria-current={row.date === today ? 'date' : undefined}
            >
              <time dateTime={row.date}>
                {formatShort(row.date)} <small>{WEEKDAYS[weekday]}</small>
              </time>
              <div className="chips">
                {duty.map(({ name, index }) => (
                  <PersonChip key={name} name={name} index={index} mark={row.marks[index]} />
                ))}
                {isCleaningOnly && <span className="hint">Прибирання</span>}
              </div>
              {marking && !isCleaningOnly && <MarkList roster={roster} row={row} today={today} {...marking} />}
              {away.length > 0 && !isCleaningOnly && (
                <details className="away">
                  <summary>Немає: {away.length}</summary>
                  {away.map(({ name }) => name).join(', ')}
                </details>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};
