import { useCallback, useEffect, useRef, useState } from 'react';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.events',
];

/** The token lives only in memory, so it disappears with the tab. */
export const useGoogleAuth = (clientId: string | null) => {
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useRef<GoogleTokenClient | null>(null);
  const expiry = useRef<number | undefined>(undefined);

  const forget = useCallback((): void => {
    window.clearTimeout(expiry.current);
    setToken(null);
  }, []);

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
          setToken(response.access_token);
          window.clearTimeout(expiry.current);
          expiry.current = window.setTimeout(forget, Number(response.expires_in ?? 3600) * 1000);
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
    return () => {
      script.remove();
      window.clearTimeout(expiry.current);
    };
  }, [clientId, forget]);

  const signIn = (): void => client.current?.requestAccessToken();

  const signOut = (): void => {
    if (token) window.google?.accounts.oauth2.revoke(token);
    forget();
  };

  return { isEnabled: clientId !== null, isReady, token, error, signIn, signOut, forget };
};
