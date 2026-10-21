import type { ComponentType, ReactNode } from "react";
import ICONS from "../SvgIcons";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SectionHeader({ IconComp, title, subtitle }: { IconComp?: ComponentType; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 mb-6 pb-5 border-b border-slate-200 dark:border-slate-800">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
        
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none ${checked ? "bg-blue-600 border-blue-600" : "bg-slate-200 dark:bg-slate-700 border-transparent"}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 mt-0.5 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}>
          {i <= rating ? <ICONS.StarFilled /> : <ICONS.Star />}
        </span>
      ))}
    </div>
  );
}

export function SaveToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-200 animate-in">
      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
        <ICONS.Check />
      </span>
      <span className="text-sm font-semibold">Changes saved successfully</span>
    </div>
  );
}

export default function Constants() {
  return (
    <div>Constants</div>
  )
}



