import { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import { Users, TrendingUp, FileWarning, Banknote, Wallet, FileText, Download } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { kshShort } from "@/lib/format";
import type { HrSummary } from "@/types/hr";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const BAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-cyan-500"];

const REPORTS = [
  { id: "payroll", name: "Monthly Payroll Summary", type: "Financial", needsPeriod: true, about: "Every payslip in the month's run" },
  { id: "statutory", name: "KRA / NSSF / SHIF / Housing Levy Remittances", type: "Compliance", needsPeriod: true, about: "Employee and employer statutory amounts" },
  { id: "attendance", name: "Employee Attendance Log", type: "Operational", needsPeriod: true, about: "Clock-ins and clock-outs for the month" },
  { id: "headcount", name: "Staff Register", type: "Workforce", needsPeriod: false, about: "All employees, current and former" },
] as const;

const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

export default function HRReports() {
  const [period, setPeriod] = useState(thisMonth());
  const { data: s, loading, error, reload } = useApi<HrSummary>("/api/hr/summary");
  const trend = s?.headcount_trend ?? [];
  const maxCount = Math.max(1, ...trend.map((d) => d.count));

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">HR Analytics</h2>
          <p className="text-sm text-slate-500">Workforce insights, payroll trends, and compliance reporting.</p>
        </div>
        <a href="/api/hr/reports/headcount" className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20">
          <Download className="w-4 h-4" /> Export Staff Register
        </a>
      </motion.div>

      {!s ? <LoadState loading={loading} error={error} onRetry={reload} /> : (
        <>
          {/* ── KPIs ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600"><Users className="w-5 h-5" /></div>
                {s.new_this_month > 0 && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">+{s.new_this_month} this month</span>}
              </div>
              <div><h3 className="text-3xl font-black text-slate-900 dark:text-white">{s.headcount}</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Headcount</p></div>
            </div>
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600"><TrendingUp className="w-5 h-5" /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Year to date</span>
              </div>
              <div><h3 className="text-3xl font-black text-slate-900 dark:text-white">{s.attrition_ytd_percent}%</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Attrition Rate</p></div>
            </div>
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600"><FileWarning className="w-5 h-5" /></div>
                {s.documents.expiring > 0 && <span className="text-[10px] font-bold text-rose-500">{s.documents.expiring} expiring</span>}
              </div>
              <div><h3 className="text-3xl font-black text-slate-900 dark:text-white">{s.documents.pending}</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Documents to Review</p></div>
            </div>
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col gap-4 shadow-xl shadow-blue-500/20 relative overflow-hidden">
              <Wallet className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 pointer-events-none" />
              <div className="flex items-center justify-between relative z-10"><div className="p-3 rounded-2xl bg-white/20"><Banknote className="w-5 h-5" /></div></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black">{s.latest_payroll ? kshShort(s.latest_payroll.gross) : "—"}</h3>
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mt-1">{s.latest_payroll ? `${s.latest_payroll.label} Gross Payroll` : "No payroll yet"}</p>
              </div>
            </div>
          </motion.div>

          {/* ── Visual Analytics Grid ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Headcount, Last 6 Months</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><div className="w-3 h-3 rounded-md bg-blue-500" /> Employed at month end</div>
              </div>
              <div className="flex items-end justify-between h-48 gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                {trend.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none">
                      {d.count} Staff
                    </div>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${(d.count / maxCount) * 100}%` }}
                      className="w-full max-w-[40px] bg-blue-500/20 dark:bg-blue-500/10 border-t-4 border-blue-500 rounded-t-xl group-hover:bg-blue-500 transition-all duration-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Workforce by Department</h3>
              <div className="space-y-5 flex-1 flex flex-col justify-center">
                {s.departments.map((d, i) => (
                  <div key={d.department}>
                    <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      <span>{d.department}</span> <span>{d.count} · {d.percent}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${d.percent}%` }} className={`h-full ${BAR_COLORS[i % BAR_COLORS.length]}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ── Reports ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reports</h3>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
            Month
            <input type="month" value={period} max={thisMonth()} onChange={(e) => setPeriod(e.target.value || thisMonth())}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200" />
          </label>
        </div>
        <Table heads={["Report Name", "Category", "Covers", "Format", "Actions"]}>
          {REPORTS.map((report) => (
            <Tr key={report.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><FileText className="w-5 h-5" /></div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{report.name}</span>
                    <span className="text-[10px] text-slate-400">{report.about}</span>
                  </div>
                </div>
              </Td>
              <Td><span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-black text-slate-500 tracking-widest uppercase">{report.type}</span></Td>
              <Td className="text-sm font-bold text-slate-600 dark:text-slate-400">{report.needsPeriod ? new Date(`${period}-01T00:00:00`).toLocaleDateString("en-KE", { month: "long", year: "numeric" }) : "All time"}</Td>
              <Td><span className="text-xs font-black uppercase text-emerald-500">CSV</span></Td>
              <Td className="text-right">
                <a href={`/api/hr/reports/${report.id}${report.needsPeriod ? `?period=${period}` : ""}`}
                  className="inline-flex items-center gap-2 text-xs px-4 py-1.5 font-bold uppercase tracking-widest rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 ml-auto">
                  <Download className="w-3 h-3" /> Download
                </a>
              </Td>
            </Tr>
          ))}
        </Table>
        <p className="px-6 py-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">Payroll and statutory reports need a payroll run for that month.</p>
      </motion.div>
    </motion.div>
  );
}
