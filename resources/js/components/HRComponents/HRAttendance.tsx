import { useState, type FormEvent } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import LoadState from "../LoadState";
import { UserCheck, CalendarX2, Clock, Search, Check, X, LogIn, LogOut, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { localIsoDate, longDate } from "@/lib/format";
import { LEAVE_TYPE_LABEL, type AttendanceDay, type AttendanceStatus, type Employee, type LeaveRequest, type LeaveType } from "@/types/hr";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const todayIso = () => localIsoDate();

const ATTENDANCE: Record<AttendanceStatus, { label: string; style: string }> = {
  on_time: { label: "On Time", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  late: { label: "Late", style: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" },
  not_in: { label: "Not In", style: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  on_leave: { label: "On Leave", style: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
};
const LEAVE_STYLE: Record<LeaveRequest["status"], string> = {
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};
const selectClass = "w-full h-11 bg-white dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200";
const EMPTY_LEAVE = { employee_id: "", type: "annual" as LeaveType, start_date: "", end_date: "", reason: "" };

export default function HRAttendance() {
  const [view, setView] = useState<"daily" | "leaves">("daily");
  const [date, setDate] = useState(todayIso());
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState(EMPTY_LEAVE);
  const [leaveErrors, setLeaveErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: day, loading, error, reload } = useApi<AttendanceDay>(`/api/hr/attendance?date=${date}`);
  const { data: leaveData, loading: leaveLoading, error: leaveError, reload: reloadLeave } = useApi<{ data: LeaveRequest[] }>(view === "leaves" ? "/api/hr/leave" : null);
  const { data: staff } = useApi<{ data: Employee[] }>(leaveOpen ? "/api/hr/employees" : null);

  const q = search.toLowerCase();
  const rows = (day?.data ?? []).filter((r) => r.name.toLowerCase().includes(q));
  const leaves = (leaveData?.data ?? []).filter((l) => l.employee.name.toLowerCase().includes(q));
  const summary = day?.summary;
  const isToday = date === todayIso();

  const clock = async (employeeId: number, action: "in" | "out") => {
    const time = isToday ? undefined : window.prompt(`Time to clock ${action} (HH:MM):`, action === "in" ? "08:00" : "17:00");
    if (!isToday && !time) return;
    try {
      await api("/api/hr/attendance/clock", { method: "POST", body: { employee_id: employeeId, action, date, time } });
      setMessage("");
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const decide = async (leave: LeaveRequest, status: "approved" | "rejected") => {
    try {
      await api(`/api/hr/leave/${leave.id}`, { method: "PATCH", body: { status } });
      setMessage("");
      reloadLeave();
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const submitLeave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/hr/leave", { method: "POST", body: { ...leaveForm, employee_id: Number(leaveForm.employee_id), reason: leaveForm.reason || null } });
      setLeaveOpen(false);
      setLeaveForm(EMPTY_LEAVE);
      reloadLeave();
      reload();
    } catch (err) {
      setLeaveErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Attendance & Leaves</h2>
          <p className="text-sm text-slate-500">Record clock-ins and manage time-off requests.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          {(["daily", "leaves"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === v ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {v === "daily" ? "Daily Roster" : "Leave Requests"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><UserCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Present {isToday ? "Today" : longDate(date)}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary ? `${summary.present} / ${summary.headcount}` : "—"}</h3>
            {summary && summary.late > 0 && <p className="text-[10px] font-bold text-rose-500">{summary.late} late</p>}
          </div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center"><CalendarX2 className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">On Leave</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.on_leave ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Requests</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.pending_leave ?? "—"}</h3></div>
        </div>
      </motion.div>

      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}

      {/* ── Dynamic Table Area ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search by name" placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20" />
          </div>
          {view === "daily" ? (
            <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value || todayIso())} aria-label="Roster date"
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200" />
          ) : (
            <Button size="sm" onClick={() => { setLeaveErrors({}); setLeaveOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> New request</Button>
          )}
        </div>

        {view === "daily" ? (
          <LoadState loading={loading} error={error} onRetry={reload} empty={rows.length === 0 && "No employees on the roster for that day."}>
            {day?.is_weekend && <p className="px-6 pt-4 text-xs font-bold text-slate-500">Weekend: attendance isn't expected.</p>}
            <Table heads={["Employee", "Time In", "Time Out", "Status", "Actions"]}>
              {rows.map((r) => (
                <Tr key={r.employee_id}>
                  <Td label="Employee">
                    <span className="font-bold text-slate-900 dark:text-white block">{r.name}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.job_title}</span>
                  </Td>
                  <Td label="Time In" className="font-bold text-slate-700 dark:text-slate-300">{r.clock_in ?? "—"}</Td>
                  <Td label="Time Out" className="font-bold text-slate-500">{r.clock_out ?? "—"}</Td>
                  <Td label="Status">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ATTENDANCE[r.status].style}`}>
                      {r.status === "on_leave" && r.leave_type ? LEAVE_TYPE_LABEL[r.leave_type as LeaveType] : ATTENDANCE[r.status].label}
                    </span>
                  </Td>
                  <Td className="text-right">
                    {r.status !== "on_leave" && (
                      <div className="flex items-center justify-end gap-2">
                        {!r.clock_in && (
                          <button onClick={() => clock(r.employee_id, "in")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 flex items-center gap-1">
                            <LogIn className="w-3.5 h-3.5" /> Clock in
                          </button>
                        )}
                        {r.clock_in && !r.clock_out && (
                          <button onClick={() => clock(r.employee_id, "out")} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
                            <LogOut className="w-3.5 h-3.5" /> Clock out
                          </button>
                        )}
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </Table>
          </LoadState>
        ) : (
          <LoadState loading={leaveLoading} error={leaveError} onRetry={reloadLeave} empty={leaves.length === 0 && "No leave requests."}>
            <Table heads={["Employee", "Leave Details", "Duration", "Status", "Actions"]}>
              {leaves.map((leave) => (
                <Tr key={leave.id}>
                  <Td label="Employee">
                    <span className="font-bold text-slate-900 dark:text-white block">{leave.employee.name}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{leave.employee.job_title}</span>
                  </Td>
                  <Td label="Leave Details">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block">{LEAVE_TYPE_LABEL[leave.type]}</span>
                    <span className="text-xs text-slate-500">{leave.reference}{leave.reason ? ` · ${leave.reason}` : ""}</span>
                  </Td>
                  <Td label="Duration">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">{longDate(leave.start_date)} – {longDate(leave.end_date)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {leave.days} working day{leave.days === 1 ? "" : "s"}{leave.annual_remaining != null ? ` · ${leave.annual_remaining} annual left` : ""}
                    </span>
                  </Td>
                  <Td label="Status">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${LEAVE_STYLE[leave.status]}`}>{leave.status}</span>
                  </Td>
                  <Td className="text-right">
                    {leave.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => decide(leave, "approved")} aria-label={`Approve ${leave.reference}`} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:scale-105 transition-all"><Check className="w-4 h-4" /></button>
                        <button onClick={() => decide(leave, "rejected")} aria-label={`Reject ${leave.reference}`} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:scale-105 transition-all"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leave.decided_at ? `Decided ${longDate(leave.decided_at)}` : "Processed"}</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </Table>
          </LoadState>
        )}
      </motion.div>

      {/* ── New leave request ── */}
      <AnimatePresence>
        {leaveOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLeaveOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              role="dialog" aria-modal="true" aria-label="New leave request"
              className="relative w-full max-w-md bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">New Leave Request</h3>
                <button onClick={() => setLeaveOpen(false)} aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={submitLeave} className="space-y-4">
                <div>
                  <label htmlFor="lv-emp" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Employee</label>
                  <select id="lv-emp" value={leaveForm.employee_id} onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })} className={selectClass} required>
                    <option value="" disabled>Choose…</option>
                    {(staff?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="lv-type" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Type</label>
                  <select id="lv-type" value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as LeaveType })} className={selectClass}>
                    {(Object.keys(LEAVE_TYPE_LABEL) as LeaveType[]).map((t) => <option key={t} value={t}>{LEAVE_TYPE_LABEL[t]}</option>)}
                  </select>
                  {leaveErrors.type && <p className="text-xs text-rose-500 mt-1">{leaveErrors.type}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="From" type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} required error={leaveErrors.start_date} />
                  <Input label="To" type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} required error={leaveErrors.end_date} />
                </div>
                <Input label="Reason (optional)" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
                {leaveErrors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{leaveErrors.form}</p>}
                <Button fullWidth type="submit" loading={saving}>Submit Request</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
