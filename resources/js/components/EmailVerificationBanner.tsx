import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, MailWarning, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

/** Prompts users who haven't confirmed their email yet; thanks them when they come back from the link. */
export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [sending, setSending] = useState(false);

  if (params.get("verified")) {
    const clear = () => setParams((p) => { const n = new URLSearchParams(p); n.delete("verified"); return n; });
    return (
      <div role="status" className="flex items-center gap-3 px-4 py-2.5 text-sm bg-emerald-50 text-emerald-800 border-b border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20">
        <CheckCircle2 className="w-4 h-4 shrink-0" /> <span className="flex-1">Thanks, your email is confirmed.</span>
        <button onClick={clear} aria-label="Dismiss" className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20"><X className="w-4 h-4" /></button>
      </div>
    );
  }
  if (!user || user.email_verified || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      const res = await api<{ message: string }>("/api/auth/email/verification-notification", { method: "POST" });
      setStatus({ text: res.message });
    } catch (err) {
      setStatus({ text: errorMessage(err), error: true });
    } finally {
      setSending(false);
    }
  };

  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm bg-blue-50 text-blue-900 border-b border-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:border-blue-500/20">
      <MailWarning className="w-4 h-4 shrink-0" />
      <span className="flex-1 min-w-[12rem]">
        {status ? <span className={status.error ? "text-rose-600 dark:text-rose-400" : ""}>{status.text}</span>
          : <>Please confirm your email: we sent a link to <strong>{user.email}</strong>.</>}
      </span>
      <button onClick={resend} disabled={sending} className="font-semibold underline underline-offset-2 disabled:opacity-50">{sending ? "Sending…" : "Resend link"}</button>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-500/20"><X className="w-4 h-4" /></button>
    </div>
  );
}
