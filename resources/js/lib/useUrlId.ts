import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * A selected record id kept in the URL (?open=12), so search results can
 * link straight to it and the browser's Back button closes it.
 */
export function useUrlId(param: string): [number | null, (id: number | null) => void] {
  const [params, setParams] = useSearchParams();
  const id = Number(params.get(param)) || null;
  const set = useCallback((next: number | null) => {
    setParams((current) => {
      const p = new URLSearchParams(current);
      if (next) p.set(param, String(next));
      else p.delete(param);
      return p;
    });
  }, [param, setParams]);
  return [id, set];
}
