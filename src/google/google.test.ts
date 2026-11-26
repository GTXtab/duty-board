import { afterEach, describe, expect, it, vi } from 'vitest';
import { readGoogleClientId } from '../config/env';
import { parseTable } from '../schedule/parseSchedule';
import { syncCalendar, upcomingDuties } from './calendar';
import { writeDutyMark } from './sheets';

const json = (body: object, status = 200): Response => Response.json(body, { status });

const TABLE = [
  ['Графік'],
  ['Дата', 'Оля', 'Макс', '', 'Дата', 'Оля Макс'],
  ['26.11.2026', 'FALSE', 'Х', '', '25.11.2026', ''],
  ['27.11.2026', 'Ч', '', '', '02.12.2026', 'Ч'],
];

const stubSheets = () => {
  const mock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
    const url = String(input);
    if (init?.method === 'PUT') return json({});
    if (url.includes('fields=')) return json({ sheets: [{ properties: { sheetId: 5, title: "Блок '4'" } }] });
    return json({ values: TABLE });
  });
  vi.stubGlobal('fetch', mock);
  return mock;
};

const writes = (mock: ReturnType<typeof stubSheets>) =>
  mock.mock.calls
    .filter(([, init]) => init?.method === 'PUT')
    .map(([url, init]) => [decodeURIComponent(String(url).split('/values/')[1] ?? ''), init?.body]);

const REF = { id: 'sheet', gid: '5' };

afterEach(() => vi.unstubAllGlobals());

describe('writeDutyMark', () => {
  it('writes a boolean into a checkbox cell', async () => {
    const mock = stubSheets();
    await writeDutyMark('t', REF, { roster: 'daily', date: '2026-11-26', member: 'Оля', done: true });
    expect(writes(mock)).toEqual([["'Блок ''4'''!B3?valueInputOption=RAW", '{"values":[[true]]}']]);
  });

  it('writes a check mark into a plain cell of the cleaning table', async () => {
    const mock = stubSheets();
    await writeDutyMark('t', REF, { roster: 'cleaning', date: '2026-12-02', member: 'Оля Макс', done: true });
    expect(writes(mock)).toEqual([["'Блок ''4'''!F4?valueInputOption=RAW", '{"values":[["✓"]]}']]);
  });

  it('never overwrites an away mark', async () => {
    const mock = stubSheets();
    await expect(
      writeDutyMark('t', REF, { roster: 'daily', date: '2026-11-26', member: 'Макс', done: true }),
    ).rejects.toThrow('Х');
    expect(writes(mock)).toEqual([]);
  });
});

describe('calendar', () => {
  const parsed = parseTable(TABLE);
  if (!parsed.ok) throw new Error('fixture');

  it('collects own daily and group duties', () => {
    expect(upcomingDuties(parsed.schedule, 'Оля', '2026-11-27').map((d) => d.date)).toEqual([
      '2026-11-27',
      '2026-12-02',
    ]);
  });

  it('removes stale events and updates existing ones instead of duplicating', async () => {
    const mock = vi.fn<typeof fetch>().mockImplementation(async (_, init) => {
      if (init?.method === 'POST') return json({}, 409);
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      return json({ items: [{ id: 'stale' }] });
    });
    vi.stubGlobal('fetch', mock);
    await syncCalendar('t', 'sheet', 'Оля', [{ date: '2026-12-31', title: 'Чергування' }], '2026-11-27');
    expect(mock.mock.calls.map(([, init]) => init?.method)).toEqual(['GET', 'DELETE', 'POST', 'PUT']);
    expect(String(mock.mock.calls[2]?.[1]?.body)).toContain('"end":{"date":"2027-01-01"}');
  });
});

describe('readGoogleClientId', () => {
  it('is optional but validated', () => {
    expect(readGoogleClientId('')).toBeNull();
    expect(readGoogleClientId('1-a.apps.googleusercontent.com')).toBe('1-a.apps.googleusercontent.com');
    expect(() => readGoogleClientId('secret')).toThrow();
  });
});
