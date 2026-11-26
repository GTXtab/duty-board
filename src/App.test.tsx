// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const paste = (value: string): void => {
  fireEvent.change(screen.getByLabelText('Або встав таблицю вручну'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Показати графік' }));
};

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

const LINK = 'https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrstuvwxyz/edit?gid=7#gid=7';

const connect = (): void => {
  fireEvent.change(screen.getByLabelText('Посилання на Google Таблицю'), {
    target: { value: LINK },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Підключити таблицю' }));
};

const csv = (body: string): Response =>
  new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8' } });

describe('App', () => {
  it('shows validation errors', () => {
    render(<App />);
    paste('Дата\tОля\n26.11.2026\t?');
    expect(screen.getByRole('alert').textContent).toContain('B2');
  });

  it('renders a pasted schedule and restores it after reload', () => {
    const view = render(<App />);
    paste('Дата\tОля\n26.11.2026\tЧ');
    expect(screen.getByText('Баланс щоденних чергувань')).toBeTruthy();
    view.unmount();
    render(<App />);
    expect(screen.getByText('Баланс щоденних чергувань')).toBeTruthy();
  });

  it('connects by link, then refreshes it on the next visit', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => csv('Дата,Оля\n26.11.2026,TRUE'));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(<App />);
    connect();
    await screen.findByText(/Дані станом на/);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://docs.google.com/spreadsheets/d/abcdefghijklmnopqrstuvwxyz/export?format=csv&gid=7',
    );
    view.unmount();
    fetchMock.mockClear();
    render(<App />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it('keeps the saved schedule when a refresh fails', async () => {
    window.localStorage.setItem(
      'duty-board:source',
      JSON.stringify({ kind: 'link', link: LINK, text: 'Дата,Оля\n26.11.2026,TRUE', fetchedAt: 0 }),
    );
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')));
    render(<App />);
    expect((await screen.findByRole('alert')).textContent).toContain('Не вдалося');
    expect(screen.getByText('Баланс щоденних чергувань')).toBeTruthy();
  });

  it('reads a schedule saved by the previous version', () => {
    window.localStorage.setItem('duty-board:sheet', 'Дата\tОля\n26.11.2026\tЧ');
    render(<App />);
    expect(screen.getByText('Баланс щоденних чергувань')).toBeTruthy();
  });
});
