import { useState, type FormEvent } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import LoadState from "../LoadState";
import { UserPlus, Search, UserCog, CheckCircle2, Clock, Mail, Phone, X, Edit2, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { ksh, localIsoDate, longDate } from "@/lib/format";
import { EMPLOYMENT_TYPE_LABEL, type Employee, type EmploymentType } from "@/types/hr";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const DEPARTMENTS = ["Operations", "Fleet Maintenance", "Customer Support", "Sales", "Finance", "Human Resources"];
const selectClass = "w-full h-11 bg-white dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200";

type Form = Record<"name" | "email" | "phone" | "job_title" | "department" | "basic_salary" | "hired_on" | "kra_pin" | "nssf_number" | "shif_number", string> & { employment_type: EmploymentType };
const EMPTY: Form = { name: "", email: "", phone: "", job_title: "", department: "Operations", employment_type: "full_time", basic_salary: "", hired_on: localIsoDate(), kra_pin: "", nssf_number: "", shif_number: "" };

interface EmployeeList {
  data: Employee[];
  summary: { headcount: number; on_leave: number; available: number };
}

export default function HREmployees() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"current" | "left">("current");
  const [modal, setModal] = useState<"new" | Employee | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const term = useDebounced(search.trim());

  const query = new URLSearchParams({ status, ...(term && { search: term }) });
  const { data, loading, error, reload } = useApi<EmployeeList>(`/api/hr/employees?${query}`);
  const staff = data?.data ?? [];
  const summary = data?.summary;

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const open = (emp: Employee | null) => {
    setErrors({});
    setForm(emp ? {
      name: emp.name, email: emp.email, phone: emp.phone ?? "", job_title: emp.job_title, department: emp.department,
      employment_type: emp.employment_type, basic_salary: String(emp.basic_salary), hired_on: emp.hired_on,
      kra_pin: emp.kra_pin ?? "", nssf_number: emp.nssf_number ?? "", shif_number: emp.shif_number ?? "",
    } : EMPTY);
    setModal(emp ?? "new");
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = { ...form, basic_salary: Number(form.basic_salary), phone: form.phone || null, kra_pin: form.kra_pin || null, nssf_number: form.nssf_number || null, shif_number: form.shif_number || null };
    try {
      if (modal === "new") await api("/api/hr/employees", { method: "POST", body });
      else if (modal) await api(`/api/hr/employees/${modal.id}`, { method: "PUT", body });
      setModal(null);
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const terminate = async (emp: Employee) => {
    const last = window.prompt(`Last working day for ${emp.name} (YYYY-MM-DD):`, localIsoDate());
    if (!last) return;
    try {
      await api(`/api/hr/employees/${emp.id}/terminate`, { method: "POST", body: { terminated_on: last } });
      setModal(null);
      reload();
    } catch (err) {
      window.alert(errorMessage(err));
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff Directory</h2>
          <p className="text-sm text-slate-500">DriveFleet's employees, roles and pay details.</p>
        </div>
        <Button onClick={() => open(null)} className="flex items-center gap-2 shadow-blue-500/20">
          <UserPlus className="w-5 h-5" /> Onboard Employee
        </Button>
      </motion.div>

      {/* ── Quick Stats ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><UserCog className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Staff</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.headcount ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Today</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.available ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">On Leave</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.on_leave ?? "—"}</h3></div>
        </div>
      </motion.div>

      {/* ── Staff Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search staff" placeholder="Search by name, role or department..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20" />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {(["current", "left"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${status === s ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500"}`}>
                {s === "current" ? "Current staff" : "Former staff"}
              </button>
            ))}
          </div>
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={staff.length === 0 && (term ? "No staff match." : status === "left" ? "No former staff." : "No employees yet.")}>
          <Table heads={["Employee Details", "Contact", "Role & Type", "Salary", "Status", "Actions"]}>
            {staff.map((emp) => (
              <Tr key={emp.id}>
                <Td label="Details">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">{emp.name.charAt(0)}</div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{emp.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{emp.number} · since {longDate(emp.hired_on)}</span>
                    </div>
                  </div>
                </Td>
                <Td label="Contact">
                  <div className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-400 space-y-1">
                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {emp.email}</span>
                    {emp.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {emp.phone}</span>}
                  </div>
                </Td>
                <Td label="Role">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{emp.job_title}</span>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{emp.department} · {EMPLOYMENT_TYPE_LABEL[emp.employment_type]}</span>
                </Td>
                <Td label="Salary" className="font-bold text-slate-700 dark:text-slate-300">{ksh(emp.basic_salary)}<span className="text-[10px] text-slate-400">/mo</span></Td>
                <Td label="Status">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    emp.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : emp.status === "on_leave" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${emp.status === "active" ? "bg-emerald-500" : emp.status === "on_leave" ? "bg-amber-500" : "bg-slate-400"}`} />
                    {emp.status === "active" ? "Active" : emp.status === "on_leave" ? "On Leave" : `Left ${emp.terminated_on ? longDate(emp.terminated_on) : ""}`}
                  </span>
                </Td>
                <Td className="text-right">
                  <button onClick={() => open(emp)} aria-label={`Edit ${emp.name}`} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      {/* ── Onboard / Edit Modal ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              role="dialog" aria-modal="true" aria-label={modal === "new" ? "Onboard employee" : "Edit employee"}
              className="relative w-full max-w-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30"><UserPlus className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{modal === "new" ? "Onboard Employee" : `Edit ${modal.name}`}</h3>
                </div>
                <button onClick={() => setModal(null)} aria-label="Close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={save} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" value={form.name} onChange={set("name")} required error={errors.name} />
                  <Input label="Email Address" type="email" value={form.email} onChange={set("email")} required error={errors.email} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Phone" value={form.phone} onChange={set("phone")} error={errors.phone} />
                  <Input label="Job Title" value={form.job_title} onChange={set("job_title")} placeholder="e.g. Chauffeur" required error={errors.job_title} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emp-dept" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Department</label>
                    <select id="emp-dept" value={form.department} onChange={set("department")} className={selectClass}>
                      {[...new Set([...DEPARTMENTS, form.department])].map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="emp-type" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Employment Type</label>
                    <select id="emp-type" value={form.employment_type} onChange={set("employment_type")} className={selectClass}>
                      {(Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map((t) => <option key={t} value={t}>{EMPLOYMENT_TYPE_LABEL[t]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Monthly Basic Salary (KSh)" type="number" min={0} value={form.basic_salary} onChange={set("basic_salary")} required error={errors.basic_salary} />
                  <Input label="Start Date" type="date" value={form.hired_on} onChange={set("hired_on")} required error={errors.hired_on} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="KRA PIN" value={form.kra_pin} onChange={set("kra_pin")} error={errors.kra_pin} />
                  <Input label="NSSF No." value={form.nssf_number} onChange={set("nssf_number")} error={errors.nssf_number} />
                  <Input label="SHA / SHIF No." value={form.shif_number} onChange={set("shif_number")} error={errors.shif_number} />
                </div>
                {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
                <div className="flex gap-3 pt-2">
                  {modal !== "new" && modal.status !== "left" && (
                    <Button type="button" variant="danger" onClick={() => terminate(modal)} className="gap-2"><LogOut className="w-4 h-4" /> Mark as left</Button>
                  )}
                  <Button fullWidth type="submit" loading={saving}>{modal === "new" ? "Add Employee" : "Save Changes"}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
