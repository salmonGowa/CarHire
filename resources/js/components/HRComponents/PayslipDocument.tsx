import { AnimatePresence, motion } from "framer-motion";
import { Printer, X } from "lucide-react";
import Button from "../Button";
import LoadState from "../LoadState";
import { useApi } from "@/lib/useApi";
import type { PayslipDetail } from "@/types/hr";

const row = (label: string, value: number, negative = false) => (
  <div className="flex justify-between py-1">
    <span>{label}</span>
    <span>{negative ? "-" : ""}{value.toLocaleString("en-KE")}</span>
  </div>
);

/** Printable payslip for one employee and month. */
export default function PayslipDocument({ payslipId, onClose }: { payslipId: number | null; onClose: () => void }) {
  const { data, loading, error, reload } = useApi<{ data: PayslipDetail }>(payslipId ? `/api/hr/payslips/${payslipId}` : null);
  const slip = payslipId && data?.data.id === payslipId ? data.data : null;
  const period = slip ? new Date(`${slip.period}-01T00:00:00`).toLocaleDateString("en-KE", { month: "long", year: "numeric" }) : "";

  return (
    <AnimatePresence>
      {payslipId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:p-0 print:static">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm print:hidden" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            role="dialog" aria-modal="true" aria-label="Payslip"
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
              <Button variant="secondary" size="sm" onClick={() => window.print()} disabled={!slip}><Printer className="w-3.5 h-3.5" /> Print / Save PDF</Button>
              <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div id="invoice-print" className="p-8 overflow-y-auto bg-[#fafafa] dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-mono text-xs rounded-b-3xl">
              {!slip ? <LoadState loading={loading} error={error} onRetry={reload} /> : (
                <>
                  <div className="text-center border-b-2 border-dashed border-slate-300 dark:border-slate-700 pb-4 mb-4">
                    <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-widest">DriveFleet Ltd</h2>
                    <p className="font-bold">PAYSLIP · {period.toUpperCase()}</p>
                    {slip.run_status === "draft" && <p className="mt-1 text-amber-600 font-bold">DRAFT, not yet approved</p>}
                  </div>
                  <div className="mb-4 space-y-0.5">
                    <p>{slip.employee_name} ({slip.employee.number})</p>
                    <p>{slip.job_title}, {slip.employee.department}</p>
                    <p>KRA PIN: {slip.employee.kra_pin ?? "—"} · NSSF: {slip.employee.nssf_number ?? "—"} · SHA: {slip.employee.shif_number ?? "—"}</p>
                  </div>
                  <p className="font-bold border-b border-slate-300 dark:border-slate-700 pb-1">EARNINGS</p>
                  {row("Basic salary", slip.gross)}
                  <p className="font-bold border-b border-slate-300 dark:border-slate-700 pb-1 mt-4">DEDUCTIONS</p>
                  {row("NSSF", slip.nssf, true)}
                  {row("SHIF", slip.shif, true)}
                  {row("Housing Levy", slip.housing_levy, true)}
                  {row("PAYE", slip.paye, true)}
                  <div className="flex justify-between py-1 text-slate-500"><span>(Taxable pay)</span><span>{slip.taxable_pay.toLocaleString("en-KE")}</span></div>
                  <div className="flex justify-between text-base font-black border-t-2 border-dashed border-slate-300 dark:border-slate-700 pt-2 mt-3 text-slate-900 dark:text-white">
                    <span>NET PAY</span><span>KSh {slip.net.toLocaleString("en-KE")}</span>
                  </div>
                  <p className="font-bold border-b border-slate-300 dark:border-slate-700 pb-1 mt-6">EMPLOYER CONTRIBUTIONS</p>
                  {row("NSSF (employer)", slip.employer_nssf)}
                  {row("Housing Levy (employer)", slip.employer_housing_levy)}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
