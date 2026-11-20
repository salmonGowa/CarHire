import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle } from "lucide-react";

/** Card used by every section of the customer's Profile page. */
export function AccountCard({ title, sub, icon, children, className = "" }: { title?: ReactNode; sub?: ReactNode; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm space-y-5 ${className}`}>
      {title && (
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">{icon}{title}</h3>
          {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function SectionHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

/** A short-lived confirmation or error, announced to screen readers. */
export function Toast({ message, error = false }: { message: string | null; error?: boolean }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold ${error ? "bg-rose-600 text-white" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"}`}>
          {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />} {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}
