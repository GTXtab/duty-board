import { BalanceChart } from './features/BalanceChart';
import { CleaningList } from './features/CleaningList';
import { GooglePanel } from './features/GooglePanel';
import type { Marking } from './features/MarkList';
import { ErrorList } from './features/ErrorList';
import { LinkForm } from './features/LinkForm';
import { ImportPanel } from './features/ImportPanel';
import { MonthCalendar } from './features/MonthCalendar';
import { TodaySummary } from './features/TodaySummary';
import { syncCalendar, upcomingDuties } from './google/calendar';
import { writeDutyMark, type DutyMark } from './google/sheets';
import { useGoogleActions } from './google/useGoogleActions';
import { useGoogleAuth } from './google/useGoogleAuth';
import { todayIso } from './schedule/date';
import { distribute } from './schedule/distribute';
import { buildSample } from './schedule/sample';
import { parseSheetLink } from './source/sheetLink';
import { useSchedule } from './useSchedule';

const formatTime = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });

export const App = ({ googleClientId }: { readonly googleClientId: string | null }) => {
  const { loaded, errors, isLoading, isPersisted, loadLink, loadText, preview, clear } =
    useSchedule();
  const auth = useGoogleAuth(googleClientId);
  const google = useGoogleActions(auth.forget);
  const today = todayIso();
  const source = loaded?.source;
  const daily = loaded && distribute(loaded.schedule.daily, today);
  const cleaning = loaded?.schedule.cleaning && distribute(loaded.schedule.cleaning, today);
  const link = source?.kind === 'link' ? source.link : null;
  const sheet = link === null ? null : parseSheetLink(link);
  const { token } = auth;

  const markingFor = (roster: DutyMark['roster']): Marking | null =>
    token && sheet && link !== null
      ? {
          isBusy: google.isBusy || isLoading,
          onToggle: (row, member, done) =>
            void google.run(async () => {
              await writeDutyMark(token, sheet, { roster, date: row.date, member, done });
              await loadLink(link);
            }, 'Таблицю оновлено.'),
        }
      : null;

  const sync = (member: string): void => {
    if (!token || !daily) return;
    const duties = upcomingDuties({ daily, cleaning: cleaning ?? null }, member, today);
    void google.run(
      () => syncCalendar(token, sheet?.id ?? 'pasted', member, duties, today),
      `Календар оновлено. Майбутніх подій: ${duties.length}.`,
    );
  };

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
          {auth.isEnabled && (
            <GooglePanel
              members={daily.members}
              isReady={auth.isReady}
              isSignedIn={token !== null}
              isBusy={google.isBusy}
              canMark={sheet !== null}
              message={auth.error ?? google.message}
              onSignIn={auth.signIn}
              onSignOut={auth.signOut}
              onSync={sync}
            />
          )}
          <TodaySummary daily={daily} cleaning={cleaning ?? null} today={today} />
          <div className={cleaning ? 'boards split' : 'boards'}>
            <MonthCalendar roster={daily} today={today} marking={markingFor('daily')} />
            {cleaning && (
              <CleaningList roster={cleaning} today={today} marking={markingFor('cleaning')} />
            )}
          </div>
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
