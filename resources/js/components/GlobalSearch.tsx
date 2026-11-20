import { useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";

interface SearchResults {
  data: { group: string; results: { title: string; subtitle: string | null; link: string }[] }[];
}

const PLACEHOLDER: Record<string, string> = {
  superadmin: "Search dealers, clients, bookings, plates…",
  dealer: "Search bookings, plates, drivers, invoices…",
  hr: "Search employees…",
  customer: "Search your bookings or vehicles to rent…",
};

/** Top-bar search across what the signed-in user can see. */
export default function GlobalSearch({ role }: { role: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const term = useDebounced(q.trim(), 250);
  const { data, loading } = useApi<SearchResults>(term.length >= 2 ? `/api/search?q=${encodeURIComponent(term)}` : null);
  const groups = term.length >= 2 ? data?.data ?? [] : [];
  const flat = groups.flatMap((g) => g.results);
  // Position of each group's first result in the flat list, for keyboard selection.
  const starts = groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.results.length, 0));

  const go = (link: string) => {
    setOpen(false);
    setQ("");
    navigate(link);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, flat.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && flat[active]) go(flat[active].link);
  };

  return (
    <div className="relative hidden md:block w-full max-w-sm">
      <div className="flex items-center gap-2 px-3 py-2 border rounded-xl transition-colors bg-slate-50 border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:bg-slate-900/50 dark:border-slate-800 dark:focus-within:border-blue-500/50">
        {loading && term.length >= 2 ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" /> : <Search className="w-4 h-4 text-slate-400" />}
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          role="combobox"
          aria-expanded={open && term.length >= 2}
          aria-controls="global-search-results"
          aria-label="Search"
          placeholder={PLACEHOLDER[role] ?? "Search…"}
          className="bg-transparent outline-none text-sm w-full placeholder-slate-400 text-slate-800 dark:text-slate-200 dark:placeholder-slate-500"
        />
      </div>
      {open && term.length >= 2 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border shadow-xl bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            {data && data.data.length === 0 && !loading && <p className="p-4 text-sm text-slate-500">Nothing matches "{term}".</p>}
            {groups.map((g, gi) => (
              <div key={g.group} className="py-1">
                <p className="px-4 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{g.group}</p>
                {g.results.map((r, ri) => {
                  const i = starts[gi] + ri;
                  return (
                    <button key={`${g.group}-${i}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => go(r.link)}
                      className={`w-full text-left px-4 py-2 ${i === active ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
                      {r.subtitle && <p className="text-xs text-slate-500 truncate">{r.subtitle}</p>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
