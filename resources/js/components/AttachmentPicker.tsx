import { Paperclip, X } from "lucide-react";

const MAX_FILES = 5;

/** Choose up to five photos or PDFs to send with a support message. */
export default function AttachmentPicker({ files, onChange, error, compact = false }: { files: File[]; onChange: (files: File[]) => void; error?: string; compact?: boolean }) {
  const add = (list: FileList | null) => onChange([...files, ...Array.from(list ?? [])].slice(0, MAX_FILES));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {files.length < MAX_FILES && (
          <label className={`inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400 font-bold ${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"}`}>
            <Paperclip className="w-4 h-4" /> {compact ? "Attach" : "Attach photos or PDFs"}
            <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          </label>
        )}
        {files.map((f, i) => (
          <span key={`${f.name}-${i}`} className="inline-flex items-center gap-1 max-w-[200px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <span className="truncate">{f.name}</span>
            <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      {!compact && <p className="text-[11px] text-slate-400">Up to {MAX_FILES} files, 5 MB each.</p>}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
