import { useState } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import LoadState from "../LoadState";
import TempPasswordNotice from "../TempPasswordNotice";
import { UserCog, UserPlus, Shield, Search, Mail, Clock, Ban, X } from "lucide-react";
import { useAuth } from "../AuthContext";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { dateTime } from "@/lib/format";
import type { AccountSummary } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const ROLE_LABEL: Record<string, string> = { superadmin: "Super Admin", hr: "HR Manager" };

interface StaffList {
  data: AccountSummary[];
  summary: { active: number; super_admins: number; signed_in_7_days: number };
}

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: (email: string, password: string) => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "hr", job_title: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await api<{ data: AccountSummary; temporary_password: string }>("/api/admin/staff", { method: "POST", body: form });
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
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} role="dialog" aria-modal="true" aria-label="Add staff member"
        className="w-full max-w-md bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-900 dark:text-white">Add Staff Member</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {field("name", "Full Name")}
          {field("email", "Work Email", "email")}
          {field("job_title", "Job Title")}
          <label className="block">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Access</span>
            <select value={form.role} onChange={set("role")} className={inputClass}>
              <option value="hr">HR Manager: HR portal only</option>
              <option value="superadmin">Super Admin: full platform access</option>
            </select>
          </label>
          {form.role === "superadmin" && <p className="text-xs text-amber-600 dark:text-amber-400">Super admins can manage every dealer, client and account, including other admins.</p>}
          {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Creating…" : "Create Account"}</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SuperAdminStaff() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi<StaffList>("/api/admin/staff");
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [message, setMessage] = useState("");

  const term = search.trim().toLowerCase();
  const staff = (data?.data ?? []).filter((s) => !term || [s.name, s.email, s.job_title ?? ""].some((v) => v.toLowerCase().includes(term)));

  const toggle = async (s: AccountSummary) => {
    const suspend = s.status === "active";
    if (!window.confirm(`${suspend ? "Suspend" : "Reinstate"} ${s.name}?`)) return;
    try {
      await api(`/api/admin/users/${s.id}/status`, { method: "PATCH", body: { suspended: suspend } });
      setMessage("");
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const kpis = [
    { label: "Active Staff", value: data?.summary.active, icon: UserCog, tone: "bg-blue-50 dark:bg-blue-500/10 text-blue-600" },
    { label: "Super Admins", value: data?.summary.super_admins, icon: Shield, tone: "bg-amber-50 dark:bg-amber-500/10 text-amber-600" },
    { label: "Signed In (7 days)", value: data?.summary.signed_in_7_days, icon: Clock, tone: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" },
  ];

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Internal Staff</h2>
          <p className="text-sm text-slate-500 mt-1">DriveFleet's own accounts: super admins and HR managers. Dealer staff are managed under each dealer.</p>
        </div>
        <Button onClick={() => setInviting(true)} className="flex items-center gap-2 shadow-blue-500/20"><UserPlus className="w-5 h-5" /> Add Staff Member</Button>
      </motion.div>

      {issued && <TempPasswordNotice email={issued.email} password={issued.password} onDismiss={() => setIssued(null)} />}

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {kpis.map(({ label, value, icon: Ico, tone }) => (
          <div key={label} className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
            <div className={`p-3.5 rounded-xl ${tone}`}><Ico className="w-6 h-6" /></div>
            <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{value ?? "—"}</h3></div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search staff" placeholder="Search staff members..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
          </div>
          {message && <p className="text-sm text-rose-600 dark:text-rose-400 mt-3">{message}</p>}
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={staff.length === 0 && "No staff match."}>
          <Table heads={["Staff Member", "Job Title", "Access", "Last Sign-in", "Status", "Actions"]}>
            {staff.map((s) => (
              <Tr key={s.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white flex items-center justify-center font-black">{s.name.charAt(0)}</div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{s.name}{s.id === user?.id && <span className="ml-2 text-[10px] font-bold text-blue-500">(you)</span>}</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mt-0.5"><Mail className="w-3 h-3" /> {s.email}</span>
                    </div>
                  </div>
                </Td>
                <Td><span className="font-bold text-slate-700 dark:text-slate-300">{s.job_title ?? "—"}</span></Td>
                <Td>
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${s.role === "superadmin"
                    ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20"
                    : "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20"}`}>{ROLE_LABEL[s.role] ?? s.role}</span>
                </Td>
                <Td className="text-xs text-slate-500">{s.last_login_at ? dateTime(s.last_login_at) : "Never"}</Td>
                <Td>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.status === "active"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                    {s.status === "suspended" && <Ban className="w-3 h-3" />}{s.status}
                  </span>
                </Td>
                <Td className="text-right">
                  {s.id !== user?.id && (
                    <button onClick={() => toggle(s)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${s.status === "active"
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"}`}>
                      {s.status === "active" ? "Suspend" : "Reinstate"}
                    </button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      <AnimatePresence>
        {inviting && <InviteModal onClose={() => setInviting(false)} onCreated={(email, password) => { setInviting(false); setIssued({ email, password }); reload(); }} />}
      </AnimatePresence>
    </motion.div>
  );
}
