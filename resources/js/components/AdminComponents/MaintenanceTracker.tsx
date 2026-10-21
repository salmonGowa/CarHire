import { useState, type FormEvent } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Input from "../Input";
import Button from "../Button";
import LoadState from "../LoadState";
import { AlertCircle, CheckCircle2, Calendar, History, Plus, X, Clock, Play, Trash2, Wrench } from "lucide-react";
import { FaTools } from "react-icons/fa";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { ksh, longDate } from "@/lib/format";
import type { MaintenanceList, MaintenanceStatus, MaintenanceTask, Paginated, Priority, Vehicle } from "@/types/models";

const STATUS_LABEL: Record<MaintenanceStatus, string> = { scheduled: "Scheduled", in_progress: "In Workshop", completed: "Completed" };
const STATUS_STYLE: Record<MaintenanceStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};
const PRIORITY_STYLE: Record<Priority, { text: string; dot: string }> = {
  high: { text: "text-rose-500", dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" },
  medium: { text: "text-amber-500", dot: "bg-amber-500" },
  low: { text: "text-blue-500", dot: "bg-blue-500" },
};

const selectClass = "w-full h-11 bg-white dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 transition-all";
const EMPTY = { vehicle_id: "", service: "", due_date: "", priority: "medium" as Priority, notes: "" };

export default function MaintenanceTracker() {
  const [view, setView] = useState<"active" | "history">("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const { data, loading, error, reload } = useApi<MaintenanceList>(`/api/maintenance?view=${view}`);
  const { data: fleet } = useApi<Paginated<Vehicle>>("/api/vehicles?per_page=100");
  const tasks = data?.data ?? [];
  const summary = data?.summary;

  // Animation Variants
  const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  const transition = async (task: MaintenanceTask, status: MaintenanceStatus) => {
    let cost: number | undefined;
    if (status === "completed") {
      const entered = window.prompt(`Cost of "${task.service}" on ${task.vehicle?.plate} (KSh, optional):`, task.cost ? String(task.cost) : "");
      if (entered === null) return;
      cost = entered.trim() ? Number(entered.replace(/[^\d]/g, "")) : undefined;
    }
    try {
      await api(`/api/maintenance/${task.id}/status`, { method: "PATCH", body: { status, cost } });
      setMessage("");
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const remove = async (task: MaintenanceTask) => {
    if (!window.confirm(`Delete the scheduled "${task.service}" for ${task.vehicle?.plate}?`)) return;
    try {
      await api(`/api/maintenance/${task.id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api("/api/maintenance", { method: "POST", body: { ...form, vehicle_id: Number(form.vehicle_id), notes: form.notes || null } });
      setIsModalOpen(false);
      setForm(EMPTY);
      if (view === "active") reload(); else setView("active");
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      initial="hidden" animate="show"
      className="space-y-6 pb-10"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fleet Maintenance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Starting a job takes the car out of service; finishing it puts it back.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex items-center gap-2" onClick={() => setView(view === "active" ? "history" : "active")}>
            {view === "active" ? <History className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {view === "active" ? "View Logs" : "View Active"}
          </Button>
          <Button onClick={() => { setErrors({}); setIsModalOpen(true); }} className="flex items-center gap-2 shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Schedule Service
          </Button>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="group p-5 rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-white dark:bg-[#0B1120] transition-all hover:shadow-lg hover:shadow-rose-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
            {summary && summary.overdue > 0 && <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">{summary.overdue} overdue</span>}
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">High-Priority Open</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary ? `${summary.critical_open} Job${summary.critical_open === 1 ? "" : "s"}` : "—"}</h3>
        </div>
        <div className="group p-5 rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-[#0B1120] transition-all hover:shadow-lg hover:shadow-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">Next 7 Days</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Soon</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary ? `${summary.due_next_7_days} Item${summary.due_next_7_days === 1 ? "" : "s"}` : "—"}</h3>
        </div>
        <div className="group p-5 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-[#0B1120] transition-all hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            {summary && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{ksh(summary.cost_this_month)} spent</span>}
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed (MTD)</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary ? `${summary.completed_this_month} Service${summary.completed_this_month === 1 ? "" : "s"}` : "—"}</h3>
        </div>
      </motion.div>

      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}

      {/* Main Content Area */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {view === "active" ? "Active Maintenance" : "Service History"}
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">{tasks.length}</span>
        </div>

        <LoadState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={tasks.length === 0 && (
            <span className="flex flex-col items-center gap-3">
              <span className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center"><Wrench className="w-8 h-8 text-slate-300" /></span>
              {view === "active" ? "No open maintenance jobs." : "No completed services yet."}
            </span>
          )}
        >
          <Table heads={["Task Detail", "Service Type", view === "active" ? "Due" : "Completed", "Priority", "Status", "Actions"]}>
            {tasks.map((task) => (
              <Tr key={task.id}>
                <Td label="Task Detail">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${view === "history" ? "bg-slate-100 dark:bg-slate-800" : "bg-blue-50 dark:bg-blue-500/10"}`}>
                      <FaTools className={`w-5 h-5 ${view === "history" ? "text-slate-400" : "text-blue-500"}`} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{task.vehicle?.model} ({task.vehicle?.plate})</span>
                      <span className="text-[11px] font-mono text-slate-400 uppercase">{task.reference}</span>
                    </div>
                  </div>
                </Td>
                <Td label="Service Type">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{task.service}</span>
                  {task.cost != null && <span className="block text-[11px] text-emerald-500 font-bold">{ksh(task.cost)}</span>}
                </Td>
                <Td label="Schedule">
                  <div className={`flex items-center gap-2 ${task.is_overdue ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{longDate(view === "history" && task.completed_at ? task.completed_at : task.due_date)}{task.is_overdue ? " · overdue" : ""}</span>
                  </div>
                </Td>
                <Td label="Priority">
                  <div className={`flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider ${PRIORITY_STYLE[task.priority].text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_STYLE[task.priority].dot}`} />
                    {task.priority}
                  </div>
                </Td>
                <Td label="Status">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLE[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {task.allowed_transitions.includes("in_progress") && (
                      <button onClick={() => transition(task, "in_progress")} title="Start job (takes the car out of service)" aria-label="Start job"
                        className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl hover:scale-105 transition-all">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {task.allowed_transitions.includes("completed") && (
                      <button onClick={() => transition(task, "completed")} title="Mark as complete" aria-label="Mark as complete"
                        className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:scale-105 transition-all">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {task.status === "scheduled" && (
                      <button onClick={() => remove(task)} title="Delete" aria-label="Delete job" className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all text-slate-400 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      {/* --- Schedule Modal --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              role="dialog" aria-modal="true" aria-label="New maintenance entry"
              className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Maintenance Entry</h3>
                <button onClick={() => setIsModalOpen(false)} aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={save} className="space-y-4">
                <div>
                  <label htmlFor="mt-vehicle" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Vehicle</label>
                  <select id="mt-vehicle" value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className={selectClass} required>
                    <option value="" disabled>Choose a vehicle…</option>
                    {(fleet?.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.model} ({v.plate})</option>)}
                  </select>
                  {errors.vehicle_id && <p className="text-xs text-rose-500 mt-1">{errors.vehicle_id}</p>}
                </div>
                <Input label="Service Required" placeholder="e.g. Brake pad replacement" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} required error={errors.service} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Due Date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required error={errors.due_date} />
                  <div>
                    <label htmlFor="mt-priority" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Priority</label>
                    <select id="mt-priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} className={selectClass}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <Input label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} error={errors.notes} />
                {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
                <Button fullWidth type="submit" className="mt-4" loading={saving}>Save Task</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
