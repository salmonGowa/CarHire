import { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import LoadState from "../LoadState";
import PayslipDocument from "./PayslipDocument";
import { AlertCircle, Banknote, Calculator, CheckCircle2, Download, FileText, Search, Info, RefreshCw, Send } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { ksh, longDate } from "@/lib/format";
import { PAYROLL_STATUS_STYLE, type PayrollRun, type Payslip } from "@/types/hr";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

export default function HRPayroll() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewingSlip, setViewingSlip] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: runsData, loading: runsLoading, error: runsError, reload: reloadRuns } = useApi<{ data: PayrollRun[] }>("/api/hr/payroll-runs");
  const runs = runsData?.data ?? [];
  const activeId = selectedId ?? runs[0]?.id ?? null;
  const { data: runData, loading, error, reload } = useApi<{ data: PayrollRun & { payslips: Payslip[] } }>(activeId ? `/api/hr/payroll-runs/${activeId}` : null);
  const run = runData?.data.id === activeId ? runData.data : null;
  const slips = (run?.payslips ?? []).filter((s) => s.employee_name.toLowerCase().includes(search.toLowerCase()));

  const act = async (path: string, ok: string, method = "POST") => {
    setBusy(true);
    try {
      const res = await api<{ data: PayrollRun }>(path, { method });
      setMessage({ tone: "ok", text: ok });
      reloadRuns();
      if (res?.data?.id) setSelectedId(res.data.id);
      reload();
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const createRun = async () => {
    const period = window.prompt("Payroll month to run (YYYY-MM):", thisMonth());
    if (!period) return;
    setBusy(true);
    try {
      const { data } = await api<{ data: PayrollRun }>("/api/hr/payroll-runs", { method: "POST", body: { period } });
      setSelectedId(data.id);
      setMessage({ tone: "ok", text: `Draft payroll for ${data.label} created for ${data.employees} employee${data.employees === 1 ? "" : "s"}. Review it, then approve.` });
      reloadRuns();
    } catch (err) {
      setMessage({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payroll & Compliance</h2>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
            <Info className="w-4 h-4 text-slate-400" /> PAYE, NSSF, SHIF and Housing Levy at 2025 rates. Have your accountant confirm current rates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="gap-2" onClick={createRun} loading={busy}><Calculator className="w-4 h-4" /> Run Payroll</Button>
          {run && (
            <>
              <a href={`/api/hr/reports/payroll?period=${run.period}`} className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white"><Download className="w-4 h-4" /> Payroll CSV</a>
              <a href={`/api/hr/reports/statutory?period=${run.period}`} className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"><Download className="w-4 h-4" /> Statutory CSV</a>
            </>
          )}
        </div>
      </motion.div>

      {message && <p className={`text-sm ${message.tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{message.text}</p>}

      {/* ── Run picker ── */}
      {runs.length > 0 && (
        <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-1">
          {runs.map((r) => (
            <button key={r.id} onClick={() => setSelectedId(r.id)} aria-pressed={r.id === activeId}
              className={`shrink-0 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${r.id === activeId ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}>
              {r.label} <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] uppercase ${PAYROLL_STATUS_STYLE[r.status]}`}>{r.status}</span>
            </button>
          ))}
        </motion.div>
      )}

      {!runsLoading && runs.length === 0 ? (
        <LoadState loading={false} error={runsError} onRetry={reloadRuns} empty="No payroll runs yet. Click Run Payroll to create the first one." />
      ) : !run ? (
        <LoadState loading={loading || runsLoading} error={error ?? runsError} onRetry={reload} />
      ) : (
        <>
          {/* ── Payroll Overview Metrics ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-xl flex flex-col justify-between">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Gross Payroll</p>
              <h3 className="text-4xl font-black mb-4">{ksh(run.gross)}</h3>
              <div className="pt-4 border-t border-white/10 flex justify-between text-xs font-bold text-slate-300">
                <span>{run.label} Cycle</span>
                <span>{run.employees} Employee{run.employees === 1 ? "" : "s"}</span>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-[2rem] border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-[#0B1120] flex flex-col justify-between">
                <p className="text-rose-600 dark:text-rose-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Employee Deductions</p>
                <div className="space-y-2">
                  {([["KRA (PAYE)", run.paye], ["NSSF", run.nssf], ["SHIF", run.shif], ["Housing Levy", run.housing_levy]] as const).map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300"><span>{label}</span><span>{ksh(value)}</span></div>
                  ))}
                </div>
              </div>
              <div className="p-6 rounded-[2rem] border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-[#0B1120] flex flex-col justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Banknote className="w-4 h-4" /> Net Pay</p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{ksh(run.net)}</h3>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${PAYROLL_STATUS_STYLE[run.status]}`}>
                    {run.status === "draft" ? "Draft: review before approving" : run.status === "approved" ? `Approved ${run.approved_at ? longDate(run.approved_at) : ""}` : `Paid ${run.paid_at ? longDate(run.paid_at) : ""}`}
                  </span>
                  {run.status === "draft" && (
                    <>
                      <Button size="xs" variant="secondary" onClick={() => act(`/api/hr/payroll-runs/${run.id}/recalculate`, "Recalculated from current salaries.")}><RefreshCw className="w-3 h-3" /> Recalculate</Button>
                      <Button size="xs" onClick={() => { if (window.confirm(`Approve ${run.label} payroll (${ksh(run.net)} net)? It can't be changed afterwards.`)) act(`/api/hr/payroll-runs/${run.id}/approve`, `${run.label} approved.`); }}><CheckCircle2 className="w-3 h-3" /> Approve</Button>
                    </>
                  )}
                  {run.status === "approved" && (
                    <Button size="xs" onClick={() => { if (window.confirm(`Mark ${run.label} salaries as paid?`)) act(`/api/hr/payroll-runs/${run.id}/mark-paid`, `${run.label} marked paid.`); }}><Send className="w-3 h-3" /> Mark paid</Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Employee Payroll Ledger ── */}
          <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search employee" placeholder="Search employee..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20" />
              </div>
            </div>
            <LoadState loading={false} error={null} empty={slips.length === 0 && "No payslips match."}>
              <Table heads={["Employee", "Gross Pay", "PAYE", "NSSF · SHIF · Levy", "Net Pay", "Payslip"]}>
                {slips.map((slip) => (
                  <Tr key={slip.id}>
                    <Td>
                      <span className="font-bold text-slate-900 dark:text-white block">{slip.employee_name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{slip.job_title}</span>
                    </Td>
                    <Td className="text-slate-600 dark:text-slate-400 font-bold">{ksh(slip.gross)}</Td>
                    <Td className="text-rose-500 font-bold">-{ksh(slip.paye)}</Td>
                    <Td>
                      <div className="flex flex-col text-xs font-bold text-amber-600">
                        <span>-{ksh(slip.nssf)} <span className="text-[9px] text-slate-400 uppercase">NSSF</span></span>
                        <span>-{ksh(slip.shif)} <span className="text-[9px] text-slate-400 uppercase">SHIF</span></span>
                        <span>-{ksh(slip.housing_levy)} <span className="text-[9px] text-slate-400 uppercase">Levy</span></span>
                      </div>
                    </Td>
                    <Td className="font-black text-emerald-600 dark:text-emerald-400 text-base">{ksh(slip.net)}</Td>
                    <Td className="text-right">
                      <button onClick={() => setViewingSlip(slip.id)} className="flex items-center justify-end gap-1 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-blue-500 transition-all font-bold text-xs uppercase tracking-widest ml-auto">
                        <FileText className="w-4 h-4" /> View
                      </button>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </LoadState>
          </motion.div>
        </>
      )}

      <PayslipDocument payslipId={viewingSlip} onClose={() => setViewingSlip(null)} />
    </motion.div>
  );
}
