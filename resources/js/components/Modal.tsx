import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * A centred dialog with a header, scrollable body and Escape-to-close. Render
 * it with `open` rather than conditionally so the exit animation plays.
 */
export default function Modal({ open, title, subtitle, onClose, children, width = "max-w-lg" }: {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog" aria-modal="true" aria-label={title}
            className={`relative w-full ${width} max-h-[92vh] flex flex-col bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden`}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100 dark:border-slate-800/60">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
              </div>
              <button onClick={onClose} className="p-2 -m-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0" aria-label="Close">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="overflow-y-auto custom-scrollbar">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Pick how money moved: M-PESA, cash, card or bank. */
export function MethodPicker<T extends string>({ label, value, options, onChange, error }: {
  label: string;
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {options.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={value === m.id}
            onClick={() => onChange(m.id)}
            className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
              value === m.id
                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 text-blue-600 dark:text-blue-400"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}
    </div>
  );
}
