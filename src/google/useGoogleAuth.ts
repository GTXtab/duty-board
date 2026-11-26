import { useCallback, useEffect, useRef, useState } from 'react';
import { createSession, readSession, writeSession, type Session } from './session';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.events',
];

export const useGoogleAuth = (clientId: string | null) => {
  const [session, setSession] = useState<Session | null>(() =>
    clientId === null ? null : readSession(Date.now()),
  );
  const [isReady, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useRef<GoogleTokenClient | null>(null);

  const forget = useCallback((): void => {
    writeSession(null);
    setSession(null);
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    const timer = window.setTimeout(forget, session.expiresAt - Date.now());
    return () => window.clearTimeout(timer);
  }, [session, forget]);

  useEffect(() => {
    if (clientId === null) return undefined;

    const init = (): void => {
      const oauth = window.google?.accounts.oauth2;
      if (!oauth) return;
      client.current = oauth.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(' '),
        callback: (response) => {
          const granted = response.scope?.split(' ') ?? [];
          if (!response.access_token || !SCOPES.every((scope) => granted.includes(scope))) {
            setError('Увійти не вдалося: дозволь доступ і до таблиць, і до календаря.');
            return;
          }
          setError(null);
          const next = createSession(
            response.access_token,
            Number(response.expires_in ?? 3600),
            Date.now(),
          );
          writeSession(next);
          setSession(next);
        },
        error_callback: () => setError('Вікно входу закрито або заблоковано браузером.'),
      });
      setReady(true);
    };

    // The script is loaded ahead of the click: browsers block popups opened after a delay.
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.addEventListener('load', init);
    script.addEventListener('error', () => setError('Не вдалося завантажити вхід Google.'));
    document.head.append(script);
    return () => script.remove();
  }, [clientId]);

  const token = session?.token ?? null;

  const signIn = (): void => client.current?.requestAccessToken();

  const signOut = (): void => {
    if (token) window.google?.accounts.oauth2.revoke(token);
    forget();
  };

  return { isEnabled: clientId !== null, isReady, token, error, signIn, signOut, forget };
};
