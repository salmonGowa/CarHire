import { useState } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Ban, Info, KeyRound, Mail, Phone, Shield, UserPlus, Users, X } from "lucide-react";
import LoadState from "../LoadState";
import TempPasswordNotice from "../TempPasswordNotice";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { dateTime } from "@/lib/format";
import type { AccountSummary } from "@/types/models";

type StaffMember = AccountSummary & { dealer_role: "manager" | "staff" | null; is_me: boolean };
interface StaffList {
  data: StaffMember[];
  can_manage: boolean;
  limit: number | null;
  plan: string | null;
}

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

function AddStaff({ onClose, onCreated }: { onClose: () => void; onCreated: (email: string, password: string) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", job_title: "", dealer_role: "staff" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async () => {
    setSaving(true);
    try {
      const res = await api<{ data: StaffMember; temporary_password: string }>("/api/dealer-staff", { method: "POST", body: { ...form, phone: form.phone || null } });
      onCreated(res.data.email, res.temporary_password);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };
  const field = (k: keyof typeof form, label: string, type = "text") => (
    <label className="block">
      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
      <input type={type} value={form[k]} onChange={set(k)} className={inputClass} />
      {errors[k] && <span className="block text-xs text-rose-500 mt-1">{errors[k]}</span>}
    </label>
  );
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} role="dialog" aria-modal="true" aria-label="Add staff login"
        className="w-full max-w-md bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-900 dark:text-white">Add a staff login</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {field("name", "Full name")}
          {field("email", "Email (used to sign in)", "email")}
          <div className="grid grid-cols-2 gap-4">{field("phone", "Phone", "tel")}{field("job_title", "Role / position")}</div>
          <label className="block">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Access</span>
            <select value={form.dealer_role} onChange={set("dealer_role")} className={inputClass}>
              <option value="staff">Staff: bookings, fleet, customers</option>
              <option value="manager">Manager: everything, plus staff accounts</option>
            </select>
          </label>
          {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
            <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-60">{saving ? "Creating…" : "Create login"}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function DealerStaff() {
  const { data, loading, error, reload } = useApi<StaffList>("/api/dealer-staff");
  const [adding, setAdding] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string; reset?: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const staff = data?.data ?? [];
  const active = staff.filter((s) => s.status === "active").length;
  const atLimit = data?.limit != null && staff.length >= data.limit;

  const update = async (s: StaffMember, changes: Record<string, unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    try {
      await api(`/api/dealer-staff/${s.id}`, { method: "PATCH", body: changes });
      setMessage("");
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };
  const resetPassword = async (s: StaffMember) => {
    if (!window.confirm(`Issue a new temporary password for ${s.name}? Their current password stops working.`)) return;
    try {
      const res = await api<{ temporary_password: string }>(`/api/dealer-staff/${s.id}/reset-password`, { method: "POST" });
      setIssued({ email: s.email, password: res.temporary_password, reset: true });
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff & Logins</h2>
          <p className="text-sm text-slate-500 mt-1">Who at your dealership can sign in to DriveFleet.{data && !data.can_manage && " Ask a manager to add or change accounts."}</p>
        </div>
        {data?.can_manage && (
          <button onClick={() => setAdding(true)} disabled={atLimit} title={atLimit ? "Your plan's staff limit is reached" : undefined}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50">
            <UserPlus className="w-4 h-4" /> Add staff login
          </button>
        )}
      </motion.div>

      {issued && (
        <TempPasswordNotice email={issued.email} password={issued.password} onDismiss={() => setIssued(null)} />
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Active logins", value: data ? active : "—", Icon: Users, tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10" },
          { label: "Managers", value: data ? staff.filter((s) => s.dealer_role === "manager" && s.status === "active").length : "—", Icon: Shield, tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10" },
          { label: data?.plan ? `${data.plan} plan allowance` : "Plan allowance", value: data ? `${staff.length} / ${data.limit ?? "∞"}` : "—", Icon: KeyRound, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" },
        ].map(({ label, value, Icon, tone }) => (
          <div key={label} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${tone}`}><Icon className="w-5 h-5" /></div>
            <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p><p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p></div>
          </div>
        ))}
      </motion.div>
      {atLimit && data?.can_manage && <p className="text-sm text-amber-700 dark:text-amber-400">You've used every login on your plan. Suspended logins still count; upgrade under <Link to="/dealer-account" className="font-bold underline">Plan & Compliance</Link> to add more.</p>}
      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}

      <motion.div variants={itemVariants} className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload} empty={staff.length === 0 && "No staff logins yet."}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {staff.map((s) => (
              <li key={s.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-white shrink-0 ${s.status === "active" ? "bg-gradient-to-tr from-blue-600 to-indigo-600" : "bg-slate-400"}`}>{s.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {s.name}{s.is_me && <span className="text-[10px] font-bold text-blue-500">(you)</span>}
                      {s.dealer_role === "manager" && <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20">Manager</span>}
                      {s.status === "suspended" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 dark:bg-rose-500/10"><Ban className="w-3 h-3" /> Suspended</span>}
                    </p>
                    <p className="text-xs text-slate-500 flex flex-wrap gap-x-3">
                      <span>{s.job_title ?? "Staff"}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>
                      {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>}
                      <span>{s.last_login_at ? `last signed in ${dateTime(s.last_login_at)}` : "never signed in"}</span>
                    </p>
                  </div>
                </div>
                {data?.can_manage && !s.is_me && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button onClick={() => update(s, { dealer_role: s.dealer_role === "manager" ? "staff" : "manager" })} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {s.dealer_role === "manager" ? "Make staff" : "Make manager"}
                    </button>
                    <button onClick={() => resetPassword(s)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">Reset password</button>
                    <button onClick={() => update(s, { suspended: s.status === "active" }, s.status === "active" ? `Suspend ${s.name}? They'll be signed out and can't sign in.` : undefined)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${s.status === "active" ? "border-rose-200 text-rose-600 dark:border-rose-500/30" : "border-emerald-200 text-emerald-600 dark:border-emerald-500/30"}`}>
                      {s.status === "active" ? "Suspend" : "Reinstate"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </LoadState>
      </motion.div>

      <motion.p variants={itemVariants} className="flex items-start gap-2 text-xs text-slate-500">
        <Info className="w-4 h-4 shrink-0" /> This page manages sign-in access only. Drivers you assign to bookings are under <Link to="/dealer-drivers" className="text-blue-600 hover:underline">Drivers</Link>. Payroll for your own employees isn't part of DriveFleet.
      </motion.p>

      <AnimatePresence>
        {adding && <AddStaff onClose={() => setAdding(false)} onCreated={(email, password) => { setAdding(false); setIssued({ email, password }); reload(); }} />}
      </AnimatePresence>
    </motion.div>
  );
}
