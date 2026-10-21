import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

/** Shown once after an admin creates an account: the temporary password to pass on. */
export default function TempPasswordNotice({ email, password, onDismiss }: { email: string; password: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div role="status" className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-sm text-emerald-800 dark:text-emerald-300">
      <p className="font-bold flex items-center gap-2"><KeyRound className="w-4 h-4" /> Account created for {email}</p>
      <p className="mt-1">Temporary password (shown once, so share it securely):</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 font-mono font-bold tracking-wider text-slate-900 dark:text-white">{password}</code>
        <button onClick={copy} className="p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20" aria-label="Copy password">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
        <button onClick={onDismiss} className="ml-auto text-xs font-bold underline">Done</button>
      </div>
    </div>
  );
}
