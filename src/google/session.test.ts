// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createSession, readSession, writeSession } from './session';

afterEach(() => window.sessionStorage.clear());

describe('google session', () => {
  it('is restored until shortly before the token expires', () => {
    const session = createSession('t', 3600, 0);
    writeSession(session);
    expect(readSession(3_539_999)).toEqual(session);
    expect(readSession(3_540_000)).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('is removed on sign-out', () => {
    writeSession(createSession('t', 3600, 0));
    writeSession(null);
    expect(readSession(0)).toBeNull();
  });

  it.each(['not json', '{"token":1,"expiresAt":2}', 'null'])('ignores %s', (raw) => {
    window.sessionStorage.setItem('duty-board:google-session', raw);
    expect(readSession(0)).toBeNull();
  });
});
