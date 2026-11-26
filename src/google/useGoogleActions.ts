import { useState } from 'react';
import { GoogleApiError } from './api';
import { SheetWriteError } from './sheets';

const describe = (error: unknown): string => {
  if (error instanceof SheetWriteError) return error.message;
  if (error instanceof GoogleApiError) {
    if (error.status === 401) return 'Сеанс Google завершився. Увійди ще раз.';
    if (error.status === 403) {
      return 'Google відмовив у доступі. Для галочок потрібна роль «Редактор» у таблиці.';
    }
  }
  return 'Запит до Google не вдався. Спробуй ще раз.';
};

export const useGoogleActions = (onExpired: () => void) => {
  const [isBusy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (action: () => Promise<void>, success: string): Promise<void> => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage(success);
    } catch (error) {
      if (error instanceof GoogleApiError && error.status === 401) onExpired();
      setMessage(describe(error));
    } finally {
      setBusy(false);
    }
  };

  return { isBusy, message, run };
};
