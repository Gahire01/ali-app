import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

type AsyncState<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Runs an async query with loading/error/data state. Reruns when `deps`
 * change; call `reload()` to refetch. Pass `focus` to refetch each time the
 * screen regains focus (e.g. chat unread counts after returning).
 *
 * On reload: call `setLoading(true)` before `reload()` from event handlers
 * (buttons / RefreshControl) to show a spinner.
 */
export function useAsync<T>(query: () => Promise<T>, deps: unknown[] = [], opts?: { focus?: boolean }): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await queryRef.current();
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  useFocusEffect(
    useCallback(() => {
      if (opts?.focus) setTick((t) => t + 1);
    }, [opts?.focus])
  );

  const reload = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  return { data, error, loading, reload };
}