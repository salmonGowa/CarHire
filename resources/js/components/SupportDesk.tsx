import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, Building2, CheckCircle2, Clock, Lock, MessageSquare, Plus, Search, Send, User, UserCog, X,
} from "lucide-react";
import LoadState from "./LoadState";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { dateTime } from "@/lib/format";
import type { Booking } from "@/types/models";
import type { SupportTicket, SupportTicketDetail, TicketList, TicketPriority, TicketStatus } from "@/types/platform";

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  urgent: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
  high: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  medium: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  low: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};
const STATUS_STYLE: Record<TicketStatus, string> = {
  open: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  closed: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};
const STATUS_LABEL: Record<TicketStatus, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";
const Pill = ({ className, children }: { className: string; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-transparent ${className}`}>{children}</span>
);
const OriginIcon = ({ origin }: { origin: SupportTicket["origin"] }) =>
  origin === "dealer" ? <Building2 className="w-3.5 h-3.5" /> : origin === "staff" ? <UserCog className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />;

// ─── New ticket ─────────────────────────────────────────────────────────────
function NewTicket({ categories, bookingsPath, onClose, onCreated }: {
  categories: string[];
  bookingsPath?: string;
  onClose: () => void;
  onCreated: (t: SupportTicket) => void;
}) {
  const { data: bookings } = useApi<{ data: Booking[] }>(bookingsPath ?? null);
  const [form, setForm] = useState({ subject: "", category: categories[0] ?? "Other", priority: "medium", booking_id: "", body: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const roadside = form.category === "Roadside Assistance";

  const save = async () => {
    setSaving(true);
    try {
      const res = await api<{ data: SupportTicket }>("/api/support-tickets", {
        method: "POST",
        body: { ...form, booking_id: form.booking_id ? Number(form.booking_id) : null },
      });
      onCreated(res.data);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const label = (text: string, error: string | undefined, child: ReactNode) => (
    <label className="block">
      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{text}</span>
      {child}
      {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
    </label>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} role="dialog" aria-modal="true" aria-label="New support ticket"
        className="w-full max-w-lg bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-900 dark:text-white">New Support Ticket</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {label("Subject", errors.subject, <input value={form.subject} onChange={set("subject")} className={inputClass} />)}
          <div className="grid grid-cols-2 gap-4">
            {label("Category", errors.category, <select value={form.category} onChange={set("category")} className={inputClass}>{categories.map((c) => <option key={c}>{c}</option>)}</select>)}
            {label("Priority", errors.priority, (
              <select value={roadside ? "urgent" : form.priority} disabled={roadside} onChange={set("priority")} className={inputClass}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
              </select>
            ))}
          </div>
          {roadside && <p className="text-xs text-rose-600 dark:text-rose-400 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Roadside requests go to the top of the queue. If you're in danger, call 999 or 112 first.</p>}
          {bookingsPath && label("Related booking (optional)", errors.booking_id, (
            <select value={form.booking_id} onChange={set("booking_id")} className={inputClass}>
              <option value="">None</option>
              {(bookings?.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.reference} · {b.vehicle?.model ?? "Vehicle"}</option>)}
            </select>
          ))}
          {label("Describe the problem", errors.body, <textarea value={form.body} onChange={set("body")} rows={5} className={`${inputClass} resize-none`} />)}
          {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
            <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-60">{saving ? "Sending…" : "Submit Ticket"}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Conversation ───────────────────────────────────────────────────────────
function Thread({ ticketId, admin, agents, onChanged, onClose }: {
  ticketId: number;
  admin: boolean;
  agents: TicketList["agents"];
  onChanged: () => void;
  onClose: () => void;
}) {
  const { data, error, setData, reload } = useApi<{ data: SupportTicketDetail }>(`/api/support-tickets/${ticketId}`);
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const t = data?.data;
  if (!t) return <LoadState loading={!error} error={error} onRetry={reload} />;

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      setData(await api<{ data: SupportTicketDetail }>(`/api/support-tickets/${t.id}/messages`, { method: "POST", body: { body, internal } }));
      setBody("");
      setMessage("");
      onChanged();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setSending(false);
    }
  };
  const update = async (changes: Record<string, unknown>) => {
    try {
      setData(await api<{ data: SupportTicketDetail }>(`/api/support-tickets/${t.id}`, { method: "PATCH", body: changes }));
      setMessage("");
      onChanged();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };
  const closed = t.status === "closed";
  const selectClass = "h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300";

  return (
    <div className="flex flex-col h-full min-h-[32rem]">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest">{t.reference} · {t.category}</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{t.subject}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <OriginIcon origin={t.origin} /> {t.reporter.name}{t.dealer && ` · ${t.dealer}`} · {t.reporter.email}
              {t.booking && <> · booking <span className="font-mono font-bold">{t.booking.reference}</span></>}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close ticket view" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"><X className="w-5 h-5" /></button>
        </div>
        {admin ? (
          <div className="flex flex-wrap gap-2">
            <select aria-label="Status" value={t.status} onChange={(e) => update({ status: e.target.value })} className={selectClass}>
              {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <select aria-label="Priority" value={t.priority} onChange={(e) => update({ priority: e.target.value })} className={selectClass}>
              {(["urgent", "high", "medium", "low"] as const).map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
            <select aria-label="Assignee" value={t.assignee?.id ?? ""} onChange={(e) => update({ assigned_to: e.target.value ? Number(e.target.value) : null })} className={selectClass}>
              <option value="">Unassigned</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Pill className={STATUS_STYLE[t.status]}>{STATUS_LABEL[t.status]}</Pill>
            <Pill className={PRIORITY_STYLE[t.priority]}>{t.priority}</Pill>
            {(t.status === "open" || t.status === "in_progress") && (
              <button onClick={() => update({ status: "resolved" })} className="ml-auto text-xs font-bold text-emerald-600 hover:underline">Mark as solved</button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
        {t.messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.internal
              ? "bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-200"
              : m.mine ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"}`}>
              <p className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${m.mine && !m.internal ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                {m.internal && <Lock className="w-3 h-3" />}{m.author}{m.from_support && !m.mine && " · DriveFleet Support"} · {dateTime(m.at)}{m.internal && " · internal note"}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        {closed && !admin ? (
          <p className="text-sm text-slate-500 text-center py-2">This ticket is closed. Open a new one if you still need help.</p>
        ) : (
          <>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} aria-label="Reply"
              placeholder={internal ? "Internal note, only visible to DriveFleet staff…" : t.status === "resolved" && !admin ? "Replying reopens the ticket…" : "Write a reply…"}
              className={`${inputClass} resize-none ${internal ? "!bg-amber-50 dark:!bg-amber-500/5 !border-amber-300" : ""}`} />
            <div className="flex items-center justify-between gap-3">
              {admin ? (
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="rounded" /> Internal note
                </label>
              ) : <span />}
              <button onClick={send} disabled={sending || !body.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-50">
                <Send className="w-4 h-4" /> {internal ? "Add note" : "Send"}
              </button>
            </div>
          </>
        )}
        {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}
      </div>
    </div>
  );
}

// ─── Desk ───────────────────────────────────────────────────────────────────
/**
 * Ticket list plus conversation. `admin` works the whole queue (status,
 * priority, assignment, internal notes); everyone else sees and raises their own.
 */
export default function SupportDesk({ admin = false, bookingsPath }: { admin?: boolean; bookingsPath?: string }) {
  const [status, setStatus] = useState(admin ? "active" : "all");
  const [priority, setPriority] = useState("");
  const [origin, setOrigin] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const term = useDebounced(search.trim());

  const query = new URLSearchParams({ status, ...(priority && { priority }), ...(origin && { origin }), ...(term && { search: term }) });
  const { data, loading, error, reload } = useApi<TicketList>(`/api/support-tickets?${query}`);
  const tickets = data?.data ?? [];
  const s = data?.summary;

  const kpis = admin
    ? [
        { label: "Urgent / High", value: s?.urgent_high, icon: AlertTriangle, tone: "text-rose-500" },
        { label: "Open Tickets", value: s?.active, icon: MessageSquare, tone: "text-blue-500" },
        { label: "Avg First Response (30d)", value: s ? (s.avg_first_response_hours === null ? "—" : `${s.avg_first_response_hours}h`) : undefined, icon: Clock, tone: "text-amber-500" },
        { label: "Resolved (7d)", value: s?.resolved_7_days, icon: CheckCircle2, tone: "text-emerald-500" },
      ]
    : [];
  const tabs = admin
    ? [["active", "Open"], ["resolved", "Resolved"], ["closed", "Closed"], ["all", "All"]]
    : [["all", "All"], ["active", "Open"], ["resolved", "Resolved"]];

  return (
    <div className="space-y-6">
      {admin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, icon: Ico, tone }) => (
            <div key={label} className="p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
              <div className={`flex items-center gap-2 mb-2 ${tone}`}><Ico className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">{label}</span></div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{value ?? "—"}</h3>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className={`lg:col-span-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm ${selected ? "hidden lg:block" : ""}`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search tickets" placeholder={admin ? "Search ref, subject, name, dealer…" : "Search tickets…"}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
              </div>
              {!admin && (
                <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold"><Plus className="w-4 h-4" /> New</button>
              )}
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Ticket status">
              {tabs.map(([v, l]) => (
                <button key={v} onClick={() => setStatus(v)} aria-pressed={status === v}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === v ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{l}</button>
              ))}
            </div>
            {admin && (
              <div className="flex gap-2">
                <select aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <option value="">Any priority</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
                <select aria-label="Filter by origin" value={origin} onChange={(e) => setOrigin(e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <option value="">Customers & dealers</option><option value="customer">Customers</option><option value="dealer">Dealers</option>
                </select>
              </div>
            )}
          </div>
          <LoadState loading={loading} error={error} onRetry={reload} empty={tickets.length === 0 && (admin ? "No tickets match." : "No tickets yet. Raise one if you need help.")}>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[36rem] overflow-y-auto">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setSelected(t.id)} aria-current={selected === t.id}
                    className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${selected === t.id ? "bg-blue-50/60 dark:bg-blue-500/5" : ""}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest">{t.reference}</span>
                      <span className="text-[10px] text-slate-400">{dateTime(t.last_activity_at)}</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{t.subject}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><OriginIcon origin={t.origin} /> {t.dealer ?? t.reporter.name}</span>
                      <Pill className={PRIORITY_STYLE[t.priority]}>{t.priority}</Pill>
                      <Pill className={STATUS_STYLE[t.status]}>{STATUS_LABEL[t.status]}</Pill>
                      {admin && !t.assignee && t.status !== "resolved" && t.status !== "closed" && <span className="text-[10px] font-bold text-amber-600">Unassigned</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </LoadState>
        </div>

        <div className={`lg:col-span-3 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm ${selected ? "" : "hidden lg:flex items-center justify-center"}`}>
          {selected
            ? <Thread key={selected} ticketId={selected} admin={admin} agents={data?.agents ?? []} onChanged={reload} onClose={() => setSelected(null)} />
            : <p className="text-sm text-slate-400 p-10 text-center">Select a ticket to read the conversation.</p>}
        </div>
      </div>

      <AnimatePresence>
        {creating && (
          <NewTicket categories={data?.categories ?? []} bookingsPath={bookingsPath} onClose={() => setCreating(false)}
            onCreated={(t) => { setCreating(false); setStatus("all"); setSelected(t.id); reload(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
