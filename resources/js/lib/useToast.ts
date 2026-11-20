import { useCallback, useEffect, useRef, useState } from "react";

/** A message that clears itself after a few seconds. */
export function useToast(ms = 3000) {
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback((message: string, error = false) => {
    window.clearTimeout(timer.current);
    setToast({ message, error });
    timer.current = window.setTimeout(() => setToast(null), ms);
  }, [ms]);

  return { toast, show };
}
