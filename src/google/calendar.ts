import { addDays } from '../schedule/date';
import { membersWith } from '../schedule/selectors';
import type { IsoDate, Roster, Schedule } from '../schedule/types';
import { GoogleApiError, googleRequest, isRecord } from './api';

const EVENTS = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const PROPERTY = 'dutyBoard';

export interface Duty {
  readonly date: IsoDate;
  readonly title: string;
}

export const upcomingDuties = (schedule: Schedule, member: string, today: IsoDate): Duty[] => {
  const from = (roster: Roster, title: string, includes: (name: string) => boolean): Duty[] =>
    roster.rows
      .filter(
        (row) =>
          row.date >= today &&
          membersWith(roster, row, 'assigned', 'suggested').some(({ name }) => includes(name)),
      )
      .map((row) => ({ date: row.date, title }));

  return [
    ...from(schedule.daily, 'Чергування в блоці', (name) => name === member),
    ...(schedule.cleaning
      ? from(schedule.cleaning, 'Генеральне прибирання', (group) =>
          group.split(/[\s,]+/).includes(member),
        )
      : []),
  ];
};

/** Hex is a subset of the characters Calendar accepts in event ids. */
const hash = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const readIds = (body: unknown): string[] => {
  const items = isRecord(body) && 'items' in body && Array.isArray(body.items) ? body.items : [];
  return items.flatMap((item: unknown) =>
    isRecord(item) && 'id' in item && typeof item.id === 'string' ? [item.id] : [],
  );
};

/** Makes the future events created by this app match `duties`, without duplicating them. */
export const syncCalendar = async (
  token: string,
  sheetId: string,
  member: string,
  duties: readonly Duty[],
  today: IsoDate,
): Promise<void> => {
  const tag = await hash(sheetId);
  const events = await Promise.all(
    duties.map(async ({ date, title }) => ({
      id: await hash(`${sheetId}|${member}|${title}|${date}`),
      status: 'confirmed',
      summary: title,
      start: { date },
      end: { date: addDays(date, 1) },
      extendedProperties: { private: { [PROPERTY]: tag } },
    })),
  );

  const query = new URLSearchParams({
    privateExtendedProperty: `${PROPERTY}=${tag}`,
    timeMin: `${today}T00:00:00Z`,
    singleEvents: 'true',
    maxResults: '2500',
  });
  const existing = readIds(await googleRequest(token, `${EVENTS}?${query}`));
  const wanted = new Set(events.map((event) => event.id));

  // Requests run one at a time to stay within the per-user rate limit.
  for (const id of existing.filter((candidate) => !wanted.has(candidate))) {
    await googleRequest(token, `${EVENTS}/${id}`, { method: 'DELETE' });
  }
  for (const event of events) {
    try {
      await googleRequest(token, EVENTS, { method: 'POST', body: event });
    } catch (error) {
      // The id is taken by an earlier sync, possibly by an event that was since removed.
      if (!(error instanceof GoogleApiError) || error.status !== 409) throw error;
      await googleRequest(token, `${EVENTS}/${event.id}`, { method: 'PUT', body: event });
    }
  }
};
