import { useState } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, CreditCard, Eye, FileCheck, Upload, X } from "lucide-react";
import LoadState from "../LoadState";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { PAYMENT_LABEL, ksh, longDate } from "@/lib/format";
import { DOC_STATE_LABEL, DOC_STATE_STYLE, NEEDS_UPLOAD } from "@/lib/compliance";
import type { ReceivedMethod } from "@/types/models";
import type { DealerDocument, MissingDocument, SubscriptionCharge, SubscriptionPlan } from "@/types/platform";

interface SubscriptionData {
  plan: SubscriptionPlan | null;
  usage: { vehicles: number; staff: number };
  plans: SubscriptionPlan[];
  charges: SubscriptionCharge[];
}
interface DocumentsData {
  data: DealerDocument[];
  missing: MissingDocument[];
  types: string[];
}

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const card = "rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm";
const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm";
const monthLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-KE", { month: "long", year: "numeric" });
const CHARGE_STYLE: Record<SubscriptionCharge["status"], string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  void: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const Meter = ({ label, used, limit }: { label: string; used: number; limit: number | null }) => {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5"><span>{label}</span><span>{used} / {limit ?? "Unlimited"}</span></div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: limit ? `${pct}%` : "8%" }} />
      </div>
    </div>
  );
};

function PlanTab() {
  const { data, loading, error, reload } = useApi<SubscriptionData>("/api/subscription");
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const owed = data.charges.filter((c) => c.status === "pending" || c.status === "overdue");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${card} p-6 space-y-5`}>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Current plan</p>
            {data.plan ? (
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{data.plan.name} <span className="text-base font-bold text-slate-500">· {ksh(data.plan.monthly_fee)} / month</span></p>
            ) : <p className="text-lg font-bold text-slate-500 mt-1">No plan assigned yet</p>}
          </div>
          <Meter label="Vehicles" used={data.usage.vehicles} limit={data.plan?.vehicle_limit ?? null} />
          <Meter label="Staff logins" used={data.usage.staff} limit={data.plan?.staff_limit ?? null} />
          <p className="text-xs text-slate-500">To change plan, raise a ticket under Help & Support. Upgrades take effect straight away; the new price applies from the next monthly charge.</p>
        </div>
        <div className={`${card} p-6`}>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">How to pay</p>
          {owed.length > 0 ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 mb-4">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {ksh(owed.reduce((n, c) => n + c.amount, 0))} due</p>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">{owed.map((c) => `${c.reference} (${monthLabel(c.period)})`).join(", ")}</p>
            </div>
          ) : (
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-4"><CheckCircle2 className="w-4 h-4" /> You're all paid up.</p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400">Pay by M-PESA or bank transfer and quote the charge reference. DriveFleet records the payment once it arrives, usually within one working day.</p>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800"><h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-slate-400" /> Subscription charges</h3></div>
        {data.charges.length === 0 ? <p className="p-10 text-center text-sm text-slate-400">No charges yet.</p> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.charges.map((c) => (
              <li key={c.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{monthLabel(c.period)} · {c.plan}</p>
                  <p className="text-xs text-slate-500 font-mono">{c.reference} · {c.status === "paid" && c.paid_at ? `paid ${longDate(c.paid_at)} by ${PAYMENT_LABEL[c.method as ReceivedMethod] ?? c.method}` : `due ${longDate(c.due_on)}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-900 dark:text-white">{ksh(c.amount)}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${CHARGE_STYLE[c.status]}`}>{c.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.plans.map((p) => (
          <div key={p.id} className={`p-5 rounded-2xl border ${p.id === data.plan?.id ? "border-blue-500 bg-blue-50/40 dark:bg-blue-500/5" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120]"}`}>
            <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{p.name}{p.id === data.plan?.id && " · your plan"}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{ksh(p.monthly_fee)}<span className="text-xs font-medium text-slate-400"> / month</span></p>
            <p className="text-xs text-slate-500 mt-2">{p.description}</p>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-2">{p.vehicle_limit ?? "Unlimited"} vehicles · {p.staff_limit ?? "unlimited"} staff</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UploadDialog({ doc, presetType, types, onClose, onDone }: { doc: DealerDocument | null; presetType?: string; types: string[]; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState(doc?.type ?? presetType ?? types[0] ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const form = new FormData();
    if (file) form.append("file", file);
    if (expires) form.append("expires_on", expires);
    if (!doc) form.append("type", type);
    setBusy(true);
    try {
      await api(doc ? `/api/dealer-documents/${doc.id}/file` : "/api/dealer-documents", { method: "POST", form });
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} role="dialog" aria-modal="true" aria-label="Upload document"
        className="w-full max-w-md bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-900 dark:text-white">{doc ? `Upload ${doc.type}` : "Upload a document"}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {doc?.notes && <p className="text-sm text-slate-600 dark:text-slate-400 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">{doc.notes}</p>}
          {doc?.review_note && <p className="text-sm text-rose-600 dark:text-rose-400">Previous upload rejected: {doc.review_note}</p>}
          {!doc && (
            <label className="block">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Document type</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>{types.map((t) => <option key={t}>{t}</option>)}</select>
              {errors.type && <span className="block text-xs text-rose-500 mt-1">{errors.type}</span>}
            </label>
          )}
          <label className="block">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">File (PDF, JPG or PNG, up to 5 MB)</span>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold" />
            {errors.file && <span className="block text-xs text-rose-500 mt-1">{errors.file}</span>}
          </label>
          <label className="block">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Expiry date (if it has one)</span>
            <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={inputClass} />
          </label>
          {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
            <button onClick={submit} disabled={busy || !file} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-50">{busy ? "Uploading…" : "Upload"}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ComplianceTab() {
  const { data, loading, error, reload } = useApi<DocumentsData>("/api/dealer-documents");
  const [uploading, setUploading] = useState<{ doc: DealerDocument | null; type?: string } | null>(null);
  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const todo = data.data.filter((d) => NEEDS_UPLOAD.includes(d.state) || d.state === "expired" || d.state === "expiring");
  const unrequested = data.missing.filter((m) => !m.open);

  return (
    <div className="space-y-6">
      {(todo.length > 0 || unrequested.length > 0) ? (
        <div className={`${card} p-6 border-amber-200 dark:border-amber-500/20`}>
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Needs your attention</h3>
          <ul className="mt-4 space-y-3">
            {todo.map((d) => (
              <li key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-bold">{d.type}</span> · {d.state === "expiring" || d.state === "expired" ? `${DOC_STATE_LABEL[d.state].toLowerCase()} ${d.expires_on ? longDate(d.expires_on) : ""}` : d.due_on ? `due ${longDate(d.due_on)}` : DOC_STATE_LABEL[d.state].toLowerCase()}
                </span>
                <button onClick={() => setUploading(NEEDS_UPLOAD.includes(d.state) ? { doc: d } : { doc: null, type: d.type })} className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"><Upload className="w-3.5 h-3.5" /> {NEEDS_UPLOAD.includes(d.state) ? "Upload" : "Upload renewal"}</button>
              </li>
            ))}
            {unrequested.map((m) => (
              <li key={m.type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-sm text-slate-700 dark:text-slate-300"><span className="font-bold">{m.type}</span> · required, not on file</span>
                <button onClick={() => setUploading({ doc: null, type: m.type })} className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"><Upload className="w-3.5 h-3.5" /> Upload</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> All your required documents are verified.</p>
      )}

      <div className={`${card} overflow-hidden`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><FileCheck className="w-5 h-5 text-slate-400" /> Documents on file</h3>
          <button onClick={() => setUploading({ doc: null })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"><Upload className="w-3.5 h-3.5" /> Upload document</button>
        </div>
        {data.data.length === 0 ? <p className="p-10 text-center text-sm text-slate-400">Nothing uploaded yet.</p> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.data.map((d) => (
              <li key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{d.type}{d.required && <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">required</span>}</p>
                  <p className="text-xs text-slate-500">{d.expires_on ? `Expires ${longDate(d.expires_on)}` : "No expiry"}{d.submitted_at && ` · uploaded ${longDate(d.submitted_at)}`}</p>
                  {d.state === "rejected" && d.review_note && <p className="text-xs text-rose-500 mt-0.5">Rejected: {d.review_note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${DOC_STATE_STYLE[d.state]}`}>{DOC_STATE_LABEL[d.state]}</span>
                  {d.has_file && <a href={`/api/dealer-documents/${d.id}/file?inline=1`} target="_blank" rel="noreferrer" aria-label={`Open ${d.type}`} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye className="w-4 h-4" /></a>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {uploading && <UploadDialog doc={uploading.doc} presetType={uploading.type} types={data.types} onClose={() => setUploading(null)} onDone={() => { setUploading(null); reload(); }} />}
      </AnimatePresence>
    </div>
  );
}

export default function DealerAccount() {
  const [tab, setTab] = useState<"plan" | "compliance">("plan");
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Plan & Compliance</h2>
        <p className="text-sm text-slate-500 mt-1">Your DriveFleet subscription, what you owe, and the licences and certificates we need on file.</p>
      </motion.div>
      <motion.div variants={itemVariants} className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {([["plan", "Plan & Billing"], ["compliance", "Compliance Documents"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id}
            className={`px-4 py-2.5 text-sm font-bold ${tab === id ? "text-blue-600 border-b-2 border-blue-600 -mb-px" : "text-slate-500 dark:text-slate-400"}`}>{label}</button>
        ))}
      </motion.div>
      <motion.div variants={itemVariants}>{tab === "plan" ? <PlanTab /> : <ComplianceTab />}</motion.div>
    </motion.div>
  );
}
