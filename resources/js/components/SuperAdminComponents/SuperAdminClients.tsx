import { useState, type ReactNode } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, CheckCircle2, ShieldAlert, Clock, CreditCard,
  UserPlus, ArrowLeft, Edit3, Trash2, Mail, Phone, MapPin, Calendar,
  Car, Activity, Flag, ShieldCheck, XCircle, FileText, ChevronRight, AlertCircle,
} from "lucide-react";
import LoadState from "../LoadState";
import BookingStatusPill from "../StatusPill";
import TempPasswordNotice from "../TempPasswordNotice";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { PAYMENT_LABEL, dateTime, ksh, longDate } from "@/lib/format";
import type { AdminClient, AdminClientDetail, ReceivedMethod } from "@/types/models";

// ─── Styles ─────────────────────────────────────────────────────────────────
const KYC_STYLES: Record<string, string> = {
  Verified: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};
const STATUS_STYLES: Record<string, string> = {
  Active: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  Suspended: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  Flagged: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};
const TIER_STYLES: Record<string, string> = {
  Platinum: "text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800",
  Gold: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Silver: "text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Bronze: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
};

const fade: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Card = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm ${className}`}>{children}</div>
);
const Badge = ({ label, style }: { label: ReactNode; style?: string }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style}`}>{label}</span>
);
const Avatar = ({ name, size = "md", flagged = false }: { name: string; size?: "sm" | "md" | "lg"; flagged?: boolean }) => {
  const sz = { lg: "w-16 h-16 text-xl", md: "w-10 h-10 text-sm", sm: "w-8 h-8 text-xs" }[size];
  const palette = ["from-blue-500 to-cyan-600", "from-violet-500 to-purple-700", "from-emerald-500 to-teal-600", "from-rose-500 to-pink-600", "from-amber-500 to-orange-600"];
  return (
    <div className={`relative ${sz} rounded-xl bg-gradient-to-br ${palette[name.charCodeAt(0) % palette.length]} flex items-center justify-center font-black text-white shadow-inner flex-shrink-0`}>
      {name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
      {flagged && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#0B1120]" />}
    </div>
  );
};
const RateBar = ({ rate }: { rate: number | null }) => {
  if (rate === null) return <span className="text-xs text-slate-400">No finished trips</span>;
  const color = rate >= 75 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 0.9 }} className={`h-full rounded-full ${color}`} />
      </div>
      <span className="text-xs font-black w-9 text-right text-slate-600 dark:text-slate-300">{rate}%</span>
    </div>
  );
};

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500";
const Field = ({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) => (
  <label className={`block ${className}`}>
    <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</span>
    {children}
    {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
  </label>
);

const Modal = ({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children?: ReactNode; wide?: boolean }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      role="dialog" aria-modal="true" aria-label={title}
      className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-white dark:bg-[#0B1120] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto`}
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md z-10">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{title}</h3>
        <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"><XCircle size={20} /></button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </motion.div>
);

// ─── Client form ────────────────────────────────────────────────────────────
const FIELDS = ["name", "email", "phone", "alt_phone", "national_id", "kra_pin", "date_of_birth", "gender", "address", "county", "admin_notes"] as const;
type ClientForm = Record<(typeof FIELDS)[number], string>;
const toForm = (c: AdminClient | null): ClientForm => Object.fromEntries(FIELDS.map((f) => [f, c?.[f] ?? ""])) as ClientForm;

const ClientFormView = ({ initial, onSaved, onClose }: { initial: AdminClient | null; onSaved: (c: AdminClient, password?: string) => void; onClose: () => void }) => {
  const [form, setForm] = useState<ClientForm>(toForm(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof ClientForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const text = (k: keyof ClientForm, label: string, opts: { type?: string; className?: string; required?: boolean } = {}) => (
    <Field label={label} error={errors[k]} className={opts.className}>
      <input type={opts.type ?? "text"} value={form[k]} onChange={set(k)} required={opts.required} className={inputClass} />
    </Field>
  );

  const save = async () => {
    setSaving(true);
    const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]));
    try {
      const res = await api<{ data: AdminClient; temporary_password?: string }>(initial ? `/api/admin/clients/${initial.id}` : "/api/admin/clients", { method: initial ? "PUT" : "POST", body });
      onSaved(res.data, res.temporary_password);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {text("name", "Full Name", { className: "col-span-2", required: true })}
        {text("email", "Email Address", { type: "email", required: true })}
        {text("phone", "Primary Phone", { type: "tel" })}
        {text("alt_phone", "Alt. Phone", { type: "tel" })}
        {text("date_of_birth", "Date of Birth", { type: "date" })}
        <Field label="Gender" error={errors.gender}>
          <select value={form.gender} onChange={set("gender")} className={inputClass}><option value="">—</option><option>Male</option><option>Female</option><option>Other</option></select>
        </Field>
        {text("national_id", "National ID / Passport")}
        {text("kra_pin", "KRA PIN")}
        {text("address", "Address")}
        {text("county", "County")}
      </div>
      <Field label="Internal Notes" error={errors.admin_notes}>
        <textarea value={form.admin_notes} onChange={set("admin_notes")} rows={2} className={`${inputClass} resize-none`} />
      </Field>
      {!initial && <p className="text-xs text-slate-500">Creating a client also creates their login. You'll get a temporary password to pass on.</p>}
      {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-60">{saving ? "Saving…" : initial ? "Save Changes" : "Create Client"}</button>
      </div>
    </div>
  );
};

// ─── KYC review ─────────────────────────────────────────────────────────────
const KYCReview = ({ client, onDone, onClose }: { client: AdminClient; onDone: () => void; onClose: () => void }) => {
  const [decision, setDecision] = useState<"" | "verified" | "rejected">("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const submit = async () => {
    try {
      await api(`/api/admin/clients/${client.id}/kyc`, { method: "POST", body: { decision, note: note || null } });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <Avatar name={client.name} />
        <div>
          <p className="font-black text-slate-900 dark:text-slate-100">{client.name}</p>
          <p className="text-xs text-slate-500">{client.reference} · ID: {client.national_id ?? <span className="text-rose-500 font-bold">not provided</span>} · DOB: {client.date_of_birth ? longDate(client.date_of_birth) : "—"}</p>
        </div>
      </div>
      <p className="text-xs text-slate-500 flex items-start gap-2"><FileText size={14} className="shrink-0 mt-0.5" /> Customers can't upload ID documents in the app yet, so check the ID number against the original when the client collects a car.</p>
      <div className="grid grid-cols-2 gap-3">
        {(["verified", "rejected"] as const).map(d => (
          <button key={d} onClick={() => setDecision(d)} aria-pressed={decision === d}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${decision === d
              ? d === "verified" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>
            {d === "verified" ? <><CheckCircle2 size={16} /> Approve</> : <><XCircle size={16} /> Reject</>}
          </button>
        ))}
      </div>
      {decision === "rejected" && (
        <Field label="Rejection reason (shown in the audit log)">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
        </Field>
      )}
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
        <button disabled={!decision} onClick={submit} className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 ${decision === "rejected" ? "bg-rose-600" : "bg-emerald-600"}`}>Submit Decision</button>
      </div>
    </div>
  );
};

// ─── Client detail ──────────────────────────────────────────────────────────
const ClientDetail = ({ clientId, onBack, onChanged }: { clientId: number; onBack: () => void; onChanged: () => void }) => {
  const { data, error, reload } = useApi<{ data: AdminClientDetail }>(`/api/admin/clients/${clientId}`);
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState<"edit" | "kyc" | null>(null);
  const [message, setMessage] = useState("");
  const client = data?.data;
  if (!client) return <LoadState loading={!error} error={error} onRetry={reload} />;

  const refresh = () => { reload(); onChanged(); };
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      setMessage("");
      refresh();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };
  const suspended = client.status === "Suspended";
  const toggleSuspend = () => {
    if (window.confirm(`${suspended ? "Reinstate" : "Suspend"} ${client.name}? ${suspended ? "They'll be able to sign in again." : "They'll be signed out and can't sign in."}`))
      run(() => api(`/api/admin/users/${client.id}/status`, { method: "PATCH", body: { suspended: !suspended } }));
  };
  const toggleFlag = () => run(() => api(`/api/admin/clients/${client.id}/flag`, { method: "POST", body: { flagged: !client.flagged } }));
  const remove = async () => {
    if (!window.confirm(`Delete ${client.name}'s account? Their past bookings and payments stay on the dealers' records.`)) return;
    try {
      await api(`/api/admin/clients/${client.id}`, { method: "DELETE" });
      onChanged();
      onBack();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "bookings", label: `Bookings (${client.bookings.length})` },
    { id: "payments", label: `Payments (${client.payments.length})` },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={fade} className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to clients" className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600"><ArrowLeft size={18} /></button>
          <Avatar name={client.name} size="lg" flagged={client.flagged} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{client.name}</h2>
              <Badge label={client.status} style={STATUS_STYLES[client.status]} />
              <Badge label={`KYC ${client.kyc}`} style={KYC_STYLES[client.kyc]} />
              <Badge label={client.tier} style={TIER_STYLES[client.tier]} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{client.reference} · joined {longDate(client.joined)} · {client.last_login_at ? `last sign-in ${dateTime(client.last_login_at)}` : "never signed in"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setModal("kyc")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300"><ShieldCheck size={16} /> KYC Review</button>
          <button onClick={() => setModal("edit")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300"><Edit3 size={16} /> Edit</button>
          <button onClick={toggleSuspend} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${suspended ? "bg-emerald-600" : "bg-rose-600"}`}>{suspended ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {suspended ? "Reinstate" : "Suspend"}</button>
        </div>
      </motion.div>

      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}

      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Lifetime Value", value: ksh(client.ltv), icon: CreditCard, tone: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
          { label: "Bookings", value: client.bookings_count, icon: Car, tone: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" },
          { label: "Completed Trips", value: client.completed_trips, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
          { label: "KYC", value: client.kyc, icon: ShieldCheck, tone: client.kyc === "Verified" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : client.kyc === "Pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" },
        ].map(({ label, value, icon: Ico, tone }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${tone} flex items-center justify-center flex-shrink-0`}><Ico size={20} /></div>
            <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">{value}</p></div>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={fade} className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
            className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap ${tab === t.id ? "text-blue-600 border-b-2 border-blue-600 -mb-px" : "text-slate-500 dark:text-slate-400"}`}>{t.label}</button>
        ))}
      </motion.div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Personal Details</h4>
            {[
              [Mail, "Email", client.email], [Phone, "Phone", client.phone], [Phone, "Alt. Phone", client.alt_phone],
              [Calendar, "Date of Birth", client.date_of_birth ? longDate(client.date_of_birth) : null], [Users, "Gender", client.gender],
              [FileText, "National ID", client.national_id], [FileText, "KRA PIN", client.kra_pin], [MapPin, "Address", [client.address, client.county].filter(Boolean).join(", ")],
            ].map(([Ico, label, value]) => {
              const IconCmp = Ico as typeof Mail;
              return (
                <div key={label as string} className="flex items-center gap-3 text-sm">
                  <IconCmp size={14} className="text-slate-400 shrink-0" />
                  <span className="w-28 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label as string}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{(value as string) || "—"}</span>
                </div>
              );
            })}
          </Card>
          <div className="space-y-4">
            <Card className="p-6 space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">KYC & Standing</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">{client.kyc_reviewed_at ? `${client.kyc} by ${client.kyc_reviewer ?? "an admin"} on ${longDate(client.kyc_reviewed_at)}` : "Not reviewed yet"}{client.kyc_note ? `: "${client.kyc_note}"` : ""}</p>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Completion rate (completed vs cancelled)</p>
                <RateBar rate={client.completion_rate} />
              </div>
              <p className="text-xs text-slate-500">Tier is set by lifetime value: Silver from KSh 50K, Gold from 150K, Platinum from 500K.</p>
            </Card>
            {client.admin_notes && (
              <Card className="p-5 border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
                <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Internal Note</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{client.admin_notes}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {client.bookings.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No bookings yet.</p> : client.bookings.map(b => (
            <div key={b.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{b.vehicle}</p>
                <p className="text-xs text-slate-500">{b.reference} · {b.dealer} · {longDate(b.pickup_at)}</p>
              </div>
              <div className="flex items-center gap-3"><span className="font-black text-sm text-slate-900 dark:text-white">{ksh(b.total)}</span><BookingStatusPill booking={{ status: b.status, is_overdue: false }} /></div>
            </div>
          ))}
        </Card>
      )}

      {tab === "payments" && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          {client.payments.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">No payments yet.</p> : client.payments.map(p => (
            <div key={p.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.reference}</p>
                <p className="text-xs text-slate-500">{longDate(p.paid_at)} · {PAYMENT_LABEL[p.method as ReceivedMethod] ?? p.method} · {p.booking_reference}</p>
              </div>
              <span className={`font-black text-sm ${p.status === "refunded" ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>{ksh(p.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      {tab === "activity" && (
        <Card className="p-6">
          {client.activity.length === 0 ? <p className="text-sm text-slate-400 text-center">No recorded activity.</p> : (
            <ol className="space-y-4">
              {client.activity.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0"><Activity size={14} className="text-slate-500" /></div>
                  <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.action}</p><p className="text-xs text-slate-500">{a.by} · {dateTime(a.at)}</p></div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      )}

      {tab === "settings" && (
        <div className="space-y-4 max-w-lg">
          <Card className="p-6 space-y-3">
            {[
              { label: "Edit Profile", sub: "Contact details, ID and notes", action: () => setModal("edit"), icon: Edit3 },
              { label: "KYC Review", sub: "Approve or reject identity verification", action: () => setModal("kyc"), icon: ShieldCheck },
              { label: client.flagged ? "Clear Flag" : "Flag for Review", sub: client.flagged ? "Remove the risk flag" : "Mark this account as needing attention", action: toggleFlag, icon: Flag },
              { label: suspended ? "Reinstate Account" : "Suspend Account", sub: suspended ? "Allow sign-in again" : "Sign them out and block sign-in", action: toggleSuspend, icon: suspended ? CheckCircle2 : AlertCircle },
            ].map(({ label, sub, action, icon: Ico }) => (
              <button key={label} onClick={action} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left">
                <span className="flex items-center gap-3"><Ico size={16} className="text-slate-500" /><span><span className="block font-semibold text-slate-800 dark:text-slate-200 text-sm">{label}</span><span className="block text-xs text-slate-500">{sub}</span></span></span>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            ))}
          </Card>
          <Card className="p-6 border-rose-200 dark:border-rose-900/50">
            <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3">Danger Zone</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Delete the account. Not possible while they have open bookings.</p>
            <button onClick={remove} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-sm font-bold"><Trash2 size={15} /> Delete Account</button>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {modal === "edit" && <Modal title="Edit Client Profile" onClose={() => setModal(null)} wide><ClientFormView initial={client} onClose={() => setModal(null)} onSaved={() => { setModal(null); refresh(); }} /></Modal>}
        {modal === "kyc" && <Modal title="KYC Review" onClose={() => setModal(null)}><KYCReview client={client} onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} /></Modal>}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main list ──────────────────────────────────────────────────────────────
interface ClientList {
  data: AdminClient[];
  summary: { total: number; active: number; verified: number; pending: number; flagged: number; lifetime_value: number };
}

export default function SuperAdminClients() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filterKYC, setFilterKYC] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("joined");
  const term = useDebounced(search.trim());

  const query = new URLSearchParams({ kyc: filterKYC, status: filterStatus, sort: sortBy, ...(term && { search: term }) });
  const { data, loading, error, reload } = useApi<ClientList>(`/api/admin/clients?${query}`);
  const clients = data?.data ?? [];
  const stats = data?.summary;

  if (selectedId) return <ClientDetail clientId={selectedId} onBack={() => setSelectedId(null)} onChanged={reload} />;

  const selectClass = "px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-sm text-slate-700 dark:text-slate-300";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Clients</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customer accounts, identity checks and account standing.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25"><UserPlus size={16} /> Add Client</button>
      </motion.div>

      {issued && <TempPasswordNotice email={issued.email} password={issued.password} onDismiss={() => setIssued(null)} />}

      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Users", value: stats?.total, icon: Users, tone: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" },
          { label: "Active", value: stats?.active, icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "KYC Verified", value: stats?.verified, icon: ShieldCheck, tone: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20" },
          { label: "KYC Pending", value: stats?.pending, icon: Clock, tone: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20" },
          { label: "Flagged", value: stats?.flagged, icon: ShieldAlert, tone: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20" },
          { label: "Lifetime Value", value: stats ? `${Math.round(stats.lifetime_value / 1000)}K` : undefined, icon: CreditCard, tone: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20" },
        ].map(({ label, value, icon: Ico, tone }) => (
          <Card key={label} className="p-4">
            <div className={`w-8 h-8 rounded-lg ${tone} flex items-center justify-center mb-2`}><Ico size={16} /></div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{value ?? "—"}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={fade} className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search clients" placeholder="Search name, email, phone or ID…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        <select value={filterKYC} onChange={e => setFilterKYC(e.target.value)} aria-label="Filter by KYC" className={selectClass}>
          {["All", "Verified", "Pending", "Rejected"].map(k => <option key={k} value={k}>{k === "All" ? "All KYC" : k}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filter by status" className={selectClass}>
          {["All", "Active", "Suspended", "Flagged"].map(k => <option key={k} value={k}>{k === "All" ? "All statuses" : k}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort" className={selectClass}>
          <option value="joined">Newest first</option><option value="ltv">Highest value</option><option value="name">Name</option>
        </select>
      </motion.div>

      <motion.div variants={fade}>
        <Card className="overflow-hidden">
          <LoadState loading={loading} error={error} onRetry={reload} empty={clients.length === 0 && "No clients match."}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Client", "Contact", "KYC", "Value", "Completion", "Status", ""].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" flagged={c.flagged} />
                          <div>
                            <button onClick={() => setSelectedId(c.id)} className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-blue-600 block text-left">{c.name}</button>
                            <span className="text-[10px] text-slate-400">{c.reference} · <span className={`font-bold ${TIER_STYLES[c.tier].split(" ")[0]}`}>{c.tier}</span></span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400"><span className="block">{c.email}</span><span className="block">{c.phone}</span></td>
                      <td className="px-5 py-4"><Badge label={c.kyc} style={KYC_STYLES[c.kyc]} /></td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{ksh(c.ltv)}<span className="block text-[10px] font-medium text-slate-400">{c.bookings_count} booking{c.bookings_count === 1 ? "" : "s"}</span></td>
                      <td className="px-5 py-4 w-36"><RateBar rate={c.completion_rate} /></td>
                      <td className="px-5 py-4"><Badge label={c.status} style={STATUS_STYLES[c.status]} /></td>
                      <td className="px-5 py-4 text-right"><button onClick={() => setSelectedId(c.id)} aria-label={`Open ${c.name}`} className="p-2 rounded-lg text-slate-400 hover:text-blue-500"><ChevronRight size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LoadState>
        </Card>
      </motion.div>

      <AnimatePresence>
        {creating && <Modal title="Add New Client" onClose={() => setCreating(false)} wide><ClientFormView initial={null} onClose={() => setCreating(false)} onSaved={(c, password) => { setCreating(false); if (password) setIssued({ email: c.email, password }); reload(); }} /></Modal>}
      </AnimatePresence>
    </motion.div>
  );
}
