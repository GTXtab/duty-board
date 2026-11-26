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
import type { IsoDate } from './schedule/types';
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
  const cleaning = loaded?.schedule.cleaning && distribute(loaded.schedule.cleaning, today);
  // The general cleaning replaces the daily duty on its days.
  const cleaningDays: ReadonlySet<IsoDate> = new Set(cleaning?.rows.map((row) => row.date));
  const daily = loaded && distribute(loaded.schedule.daily, today, cleaningDays);
  const link = source?.kind === 'link' ? source.link : null;
  const sheet = link === null ? null : parseSheetLink(link);
  const { token } = auth;

  const markingFor = (roster: DutyMark['roster']): Marking | null =>
    token && sheet && link !== null
      ? {
          isBusy: google.isBusy || isLoading,
          onMark: (row, member, action) =>
            void google.run(async () => {
              await writeDutyMark(token, sheet, { roster, date: row.date, member, action });
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
          <div className="actions">
            {source?.kind === 'link' && (
              <>
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
              </>
            )}
            <button type="button" className="secondary" onClick={clear}>
              Інша таблиця
            </button>
          </div>
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
          <TodaySummary
            daily={daily}
            cleaning={cleaning ?? null}
            today={today}
            marking={markingFor('daily')}
          />
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
          <div className={cleaning ? 'boards split' : 'boards'}>
            <MonthCalendar
              roster={daily}
              today={today}
              cleaningDays={cleaningDays}
              marking={markingFor('daily')}
            />
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
