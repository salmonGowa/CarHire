import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

/** Shared loading / error / empty placeholder for API-backed lists. */
export default function LoadState({ loading, error, empty, onRetry, children }: {
  loading: boolean;
  error: string | null;
  empty?: ReactNode | false;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-sm text-rose-600 dark:text-rose-400">
        <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</span>
        {onRetry && <button onClick={onRetry} className="text-blue-600 font-semibold hover:underline">Try again</button>}
      </div>
    );
  }
  if (empty) return <div className="py-16 text-center text-sm text-slate-500">{empty}</div>;
  return <>{children}</>;
}
