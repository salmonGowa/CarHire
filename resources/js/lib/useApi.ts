import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { api, ApiError } from "@/lib/api";

interface State<T> {
  key: string | null;
  data: T | null;
  error: string | null;
}

/**
 * Load JSON from the API and keep it in state. Pass null to skip loading.
 * `reload` re-fetches; `setData` lets callers apply optimistic updates.
 * `loading` is true until a response for the current path has arrived.
 */
export function useApi<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<State<T>>({ key: null, data: null, error: null });
  const key = path === null ? null : `${version}:${path}`;

  useEffect(() => {
    if (key === null || path === null) return;
    let cancelled = false;
    api<T>(path)
      .then((result) => {
        if (!cancelled) setState({ key, data: result, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState((s) => ({ key, data: s.data, error: err instanceof ApiError ? err.message : "Couldn't load data." }));
      });
    return () => {
      cancelled = true;
    };
  }, [key, path]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (next: SetStateAction<T | null>) =>
      setState((s) => ({ ...s, data: typeof next === "function" ? (next as (prev: T | null) => T | null)(s.data) : next })),
    [],
  );

  const loading = key !== null && state.key !== key;

  return { data: state.data, setData, error: loading ? null : state.error, loading, reload };
}
