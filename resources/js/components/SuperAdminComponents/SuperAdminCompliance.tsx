import { useState, type ReactNode } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import {
  FileCheck, ShieldAlert, Building2, AlertTriangle, Search, CheckCircle2, Clock, Trash2, XCircle, Plus, Eye, Upload, FileWarning,
} from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { localIsoDate, longDate } from "@/lib/format";
import { DOC_STATE_LABEL, DOC_STATE_STYLE, NEEDS_UPLOAD } from "@/lib/compliance";
import type { AdminDealer } from "@/types/models";
import type { DealerDocument, DocumentState, MissingDocument } from "@/types/platform";

interface ComplianceData {
  data: DealerDocument[];
  gaps: { dealer: { id: number; name: string }; missing: MissingDocument[] }[];
  types: string[];
  required_types: string[];
  summary: { pending_review: number; action_needed: number; awaiting_dealer: number; active_dealers: number; compliant_dealers: number; compliance_rate: number };
}

const fade: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const inputClass = "w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500";
const areaClass = "w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 resize-none";

const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="block">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{label}</span>
    {children}
    {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
  </label>
);

const Modal = ({ title, onClose, children }: { title: ReactNode; onClose: () => void; children?: ReactNode }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}
      className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/60 sticky top-0 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md z-10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>
        <button onClick={onClose} aria-label="Close" className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"><XCircle className="w-6 h-6" /></button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </motion.div>
);

const Actions = ({ onCancel, onSubmit, label, busy, danger = false }: { onCancel: () => void; onSubmit: () => void; label: string; busy: boolean; danger?: boolean }) => (
  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
    <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
    <button onClick={onSubmit} disabled={busy} className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 ${danger ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-600 hover:bg-blue-500"}`}>{busy ? "Saving…" : label}</button>
  </div>
);

// ─── Request a document ─────────────────────────────────────────────────────
const RequestForm = ({ types, preset, onDone, onClose }: { types: string[]; preset: { dealer_id?: number; type?: string }; onDone: () => void; onClose: () => void }) => {
  const { data: dealers } = useApi<{ data: AdminDealer[] }>("/api/admin/dealers?status=All");
  const [form, setForm] = useState({ dealer_id: preset.dealer_id ? String(preset.dealer_id) : "", type: preset.type ?? types[0] ?? "", due_on: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    try {
      await api("/api/admin/compliance", { method: "POST", body: { ...form, dealer_id: Number(form.dealer_id) || null, due_on: form.due_on || null, notes: form.notes || null } });
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Dealership" error={errors.dealer_id}>
        <select value={form.dealer_id} onChange={set("dealer_id")} className={inputClass}>
          <option value="">Choose a dealer…</option>
          {(dealers?.data ?? []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Document Type" error={errors.type}>
          <select value={form.type} onChange={set("type")} className={inputClass}>{types.map(t => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Due Date" error={errors.due_on}>
          <input type="date" min={localIsoDate()} value={form.due_on} onChange={set("due_on")} className={inputClass} />
        </Field>
      </div>
      <Field label="Instructions for the dealer" error={errors.notes}>
        <textarea value={form.notes} onChange={set("notes")} rows={3} className={areaClass} />
      </Field>
      <p className="text-xs text-slate-500">The dealer sees the request under Account → Compliance in their portal. There are no email notifications yet, so follow up by phone for anything urgent.</p>
      {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
      <Actions onCancel={onClose} onSubmit={submit} label="Send Request" busy={busy} />
    </div>
  );
};

// ─── Upload on the dealer's behalf ──────────────────────────────────────────
const UploadForm = ({ doc, onDone, onClose }: { doc: DealerDocument; onDone: () => void; onClose: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState(doc.expires_on ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const form = new FormData();
    if (file) form.append("file", file);
    if (expires) form.append("expires_on", expires);
    setBusy(true);
    try {
      await api(`/api/admin/compliance/${doc.id}/file`, { method: "POST", form });
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600 dark:text-slate-400">Upload {doc.dealer.name}'s {doc.type} for them, for example when they've emailed it in. It goes to review like any other upload.</p>
      <Field label="File (PDF, JPG or PNG, up to 5 MB)" error={errors.file}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold" />
      </Field>
      <Field label="Expiry date (if any)" error={errors.expires_on}>
        <input type="date" value={expires} onChange={e => setExpires(e.target.value)} className={inputClass} />
      </Field>
      {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
      <Actions onCancel={onClose} onSubmit={submit} label="Upload" busy={busy || !file} />
    </div>
  );
};

// ─── Review ─────────────────────────────────────────────────────────────────
const ReviewForm = ({ doc, onDone }: { doc: DealerDocument; onDone: () => void }) => {
  const [expires, setExpires] = useState(doc.expires_on ?? "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const decide = async (decision: "verified" | "rejected") => {
    setBusy(true);
    try {
      await api(`/api/admin/compliance/${doc.id}/review`, { method: "POST", body: { decision, expires_on: expires || null, note: note || null } });
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setBusy(false);
    }
  };
  const fileUrl = `/api/admin/compliance/${doc.id}/file`;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0"><FileCheck className="w-6 h-6" /></div>
        <div className="min-w-0">
          <p className="font-black text-slate-900 dark:text-white">{doc.type}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">{doc.dealer.name} · {doc.reference}{doc.submitted_at && ` · uploaded ${longDate(doc.submitted_at)}`}</p>
        </div>
      </div>
      {doc.has_file && (
        <a href={`${fileUrl}?inline=1`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/5">
          <Eye className="w-4 h-4" /> Open {doc.original_name}
        </a>
      )}
      <Field label="Expiry date (check it against the document)" error={errors.expires_on}>
        <input type="date" min={localIsoDate()} value={expires} onChange={e => setExpires(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Rejection reason (shown to the dealer)" error={errors.note}>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Only needed when rejecting" className={areaClass} />
      </Field>
      {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <button disabled={busy} onClick={() => decide("rejected")} className="flex-1 py-2.5 rounded-xl border border-rose-300 text-rose-600 dark:border-rose-500/40 dark:text-rose-400 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-60">Reject</button>
        <button disabled={busy} onClick={() => decide("verified")} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-60">Approve Document</button>
      </div>
    </div>
  );
};

// ─── Main ───────────────────────────────────────────────────────────────────
type ModalState =
  | { type: "request"; preset: { dealer_id?: number; type?: string } }
  | { type: "review" | "upload"; doc: DealerDocument }
  | null;

export default function SuperAdminCompliance() {
  const [search, setSearch] = useState("");
  const [state, setState] = useState<"" | DocumentState>("");
  const [modal, setModal] = useState<ModalState>(null);
  const [message, setMessage] = useState("");
  const term = useDebounced(search.trim());
  const query = new URLSearchParams({ ...(state && { state }), ...(term && { search: term }) });
  const { data, loading, error, reload } = useApi<ComplianceData>(`/api/admin/compliance?${query}`);
  const docs = data?.data ?? [];
  const s = data?.summary;

  const done = () => { setModal(null); setMessage(""); reload(); };
  const remove = async (doc: DealerDocument) => {
    if (!window.confirm(`Delete ${doc.dealer.name}'s ${doc.type} record${doc.has_file ? " and its file" : ""}? This can't be undone.`)) return;
    try {
      await api(`/api/admin/compliance/${doc.id}`, { method: "DELETE" });
      done();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Compliance & Legal</h2>
          <p className="text-sm text-slate-500 mt-1">Dealer licences, tax certificates and insurance. Files are stored privately and only admins and the dealer can open them.</p>
        </div>
        <button onClick={() => setModal({ type: "request", preset: {} })} className="flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-blue-500/20">
          <Plus className="w-5 h-5" /> Request Document
        </button>
      </motion.div>

      <motion.div variants={fade} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <button onClick={() => setState("pending_review")} className="text-left p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm hover:border-blue-300">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600"><Clock className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Reviews</p><h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{s?.pending_review ?? "—"}</h3></div>
        </button>
        <div className="p-6 rounded-[2rem] border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600"><ShieldAlert className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-rose-600 uppercase tracking-widest">Expired / Overdue / Rejected</p><h3 className="text-2xl font-black text-rose-600 mt-0.5">{s?.action_needed ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fully Compliant Dealers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{s ? `${s.compliance_rate}%` : "—"}</h3>
            {s && <p className="text-[10px] font-bold text-slate-400">{s.compliant_dealers} of {s.active_dealers} active dealers</p>}
          </div>
        </div>
      </motion.div>

      {data && data.gaps.length > 0 && (
        <motion.div variants={fade} className="rounded-[2rem] border border-amber-200 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5 p-6">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><FileWarning className="w-5 h-5 text-amber-500" /> Missing required documents</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Every active dealer needs a valid {data.required_types.join(", ")}.</p>
          <div className="space-y-3">
            {data.gaps.map(g => (
              <div key={g.dealer.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="w-48 shrink-0 font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> {g.dealer.name}</span>
                <div className="flex flex-wrap gap-2">
                  {g.missing.map(m => m.open ? (
                    <span key={m.type} className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">{m.type} · in progress</span>
                  ) : (
                    <button key={m.type} onClick={() => setModal({ type: "request", preset: { dealer_id: g.dealer.id, type: m.type } })}
                      className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/10">
                      Request {m.type}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={fade} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search documents" placeholder="Search documents or dealers..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
          </div>
          <select value={state} onChange={e => setState(e.target.value as DocumentState | "")} aria-label="Filter by status"
            className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-bold">
            <option value="">Current documents</option>
            {(Object.keys(DOC_STATE_LABEL) as DocumentState[]).map(k => <option key={k} value={k}>{DOC_STATE_LABEL[k]}</option>)}
          </select>
        </div>
        {message && <p className="px-6 pt-4 text-sm text-rose-600">{message}</p>}

        <LoadState loading={loading} error={error} onRetry={reload} empty={docs.length === 0 && "No compliance records match."}>
          <Table heads={["Dealership", "Document", "Due / Expires", "Status", "Actions"]}>
            {docs.map(doc => (
              <Tr key={doc.id}>
                <Td label="Dealership">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{doc.dealer.name}</span>
                  </div>
                </Td>
                <Td label="Document">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm block">{doc.type}</span>
                  <span className="font-mono text-[10px] font-black text-slate-400 tracking-widest mt-0.5 block">{doc.reference}{doc.required && " · required"}</span>
                  {doc.review_note && doc.state === "rejected" && <span className="text-[11px] text-rose-500 block mt-0.5">“{doc.review_note}”</span>}
                </Td>
                <Td label="Due / Expires" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {NEEDS_UPLOAD.includes(doc.state) && doc.due_on ? `Due ${longDate(doc.due_on)}` : doc.expires_on ? `Expires ${longDate(doc.expires_on)}` : "No expiry"}
                </Td>
                <Td label="Status">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${DOC_STATE_STYLE[doc.state]}`}>
                    {["overdue", "expired", "expiring", "rejected"].includes(doc.state) && <AlertTriangle className="w-3 h-3" />}
                    {doc.state === "verified" && <CheckCircle2 className="w-3 h-3" />}
                    {doc.state === "pending_review" && <Clock className="w-3 h-3" />}
                    {DOC_STATE_LABEL[doc.state]}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-1">{doc.reviewer ? `${longDate(doc.reviewed_at ?? doc.updated_at)} by ${doc.reviewer}` : `Updated ${longDate(doc.updated_at)}`}</span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {doc.state === "pending_review" && (
                      <button onClick={() => setModal({ type: "review", doc })} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">Review</button>
                    )}
                    {NEEDS_UPLOAD.includes(doc.state) && (
                      <button onClick={() => setModal({ type: "upload", doc })} title="Upload for the dealer" aria-label={`Upload ${doc.type} for ${doc.dealer.name}`} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl"><Upload className="w-5 h-5" /></button>
                    )}
                    {doc.has_file && (
                      <a href={`/api/admin/compliance/${doc.id}/file?inline=1`} target="_blank" rel="noreferrer" title="Open file" aria-label={`Open ${doc.type} file`} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl"><Eye className="w-5 h-5" /></a>
                    )}
                    <button onClick={() => remove(doc)} title="Delete record" aria-label={`Delete ${doc.type} record`} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      <AnimatePresence>
        {modal?.type === "request" && data && (
          <Modal title="Request Compliance Document" onClose={() => setModal(null)}><RequestForm types={data.types} preset={modal.preset} onDone={done} onClose={() => setModal(null)} /></Modal>
        )}
        {modal?.type === "review" && <Modal title="Review Document" onClose={() => setModal(null)}><ReviewForm doc={modal.doc} onDone={done} /></Modal>}
        {modal?.type === "upload" && <Modal title="Upload Document" onClose={() => setModal(null)}><UploadForm doc={modal.doc} onDone={done} onClose={() => setModal(null)} /></Modal>}
      </AnimatePresence>
    </motion.div>
  );
}
