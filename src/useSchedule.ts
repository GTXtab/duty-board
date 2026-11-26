import { useCallback, useEffect, useRef, useState } from 'react';
import { parseSchedule } from './schedule/parseSchedule';
import type { Schedule } from './schedule/types';
import { fetchSheet } from './source/fetchSheet';
import { readSource, writeSource, type SavedSource } from './source/storage';

interface Loaded {
  readonly source: SavedSource;
  readonly schedule: Schedule;
}

const parseSource = (source: SavedSource) =>
  parseSchedule(source.text, source.kind === 'link' ? ',' : '\t');

const restore = (): Loaded | null => {
  const source = readSource();
  if (!source) return null;
  const result = parseSource(source);
  return result.ok ? { source, schedule: result.schedule } : null;
};

export const useSchedule = () => {
  const [loaded, setLoaded] = useState(restore);
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isPersisted, setPersisted] = useState(true);
  const request = useRef<AbortController | null>(null);

  const apply = useCallback((source: SavedSource, persist: boolean): void => {
    const result = parseSource(source);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setLoaded({ source, schedule: result.schedule });
    setPersisted(persist && writeSource(source));
  }, []);

  const cancel = useCallback((): void => {
    request.current?.abort();
    request.current = null;
    setLoading(false);
  }, []);

  const loadLink = useCallback(
    async (link: string): Promise<void> => {
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);

      const response = await fetchSheet(link, controller.signal);
      // A newer request or a reset has replaced this one.
      if (controller.signal.aborted) return;

      setLoading(false);
      if (response.ok) {
        apply({ kind: 'link', link, text: response.text, fetchedAt: Date.now() }, true);
      } else setErrors([response.error]);
    },
    [apply],
  );

  const savedLink = loaded?.source.kind === 'link' ? loaded.source.link : null;

  useEffect(() => {
    if (savedLink === null) return undefined;
    const refreshIfVisible = (): void => {
      if (document.visibilityState === 'visible') void loadLink(savedLink);
    };
    refreshIfVisible();
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible);
      cancel();
    };
  }, [savedLink, loadLink, cancel]);

  const loadText = (text: string): void => {
    cancel();
    apply({ kind: 'paste', text }, true);
  };

  const preview = (text: string): void => {
    cancel();
    apply({ kind: 'paste', text }, false);
  };

  const clear = (): void => {
    cancel();
    writeSource(null);
    setErrors([]);
    setLoaded(null);
  };

  return { loaded, errors, isLoading, isPersisted, loadLink, loadText, preview, clear };
};
