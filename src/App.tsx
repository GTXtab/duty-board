import { BalanceChart } from './features/BalanceChart';
import { CleaningList } from './features/CleaningList';
import { ErrorList } from './features/ErrorList';
import { LinkForm } from './features/LinkForm';
import { ImportPanel } from './features/ImportPanel';
import { MonthCalendar } from './features/MonthCalendar';
import { TodaySummary } from './features/TodaySummary';
import { todayIso } from './schedule/date';
import { distribute } from './schedule/distribute';
import { buildSample } from './schedule/sample';
import { useSchedule } from './useSchedule';

const formatTime = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });

export const App = () => {
  const { loaded, errors, isLoading, isPersisted, loadLink, loadText, preview, clear } =
    useSchedule();
  const today = todayIso();
  const source = loaded?.source;
  const daily = loaded && distribute(loaded.schedule.daily, today);
  const cleaning = loaded?.schedule.cleaning && distribute(loaded.schedule.cleaning, today);

  return (
    <main>
      <header className="top">
        <h1>Графік чергування</h1>
        {loaded && (
          <button type="button" className="secondary" onClick={clear}>
            Інша таблиця
          </button>
        )}
      </header>

      <ErrorList errors={errors} />

      {daily ? (
        <>
          {!isPersisted && (
            <p className="hint" role="status">
              Ця таблиця не збережена й зникне після перезавантаження сторінки.
            </p>
          )}
          {source?.kind === 'link' && (
            <div className="actions">
              <p className="hint" role="status">
                Дані станом на {formatTime.format(source.fetchedAt)}
              </p>
              <button
                type="button"
                className="secondary"
                disabled={isLoading}
                onClick={() => void loadLink(source.link)}
              >
                {isLoading ? 'Оновлюю…' : 'Оновити'}
              </button>
            </div>
          )}
          <TodaySummary daily={daily} cleaning={cleaning ?? null} today={today} />
          <MonthCalendar roster={daily} today={today} />
          {cleaning && <CleaningList roster={cleaning} today={today} />}
          <BalanceChart roster={daily} />
        </>
      ) : (
        <>
          <LinkForm isLoading={isLoading} onSubmit={(link) => void loadLink(link)} />
          <ImportPanel onImport={loadText} onSample={() => preview(buildSample(today))} />
        </>
      )}
    </main>
  );
};
