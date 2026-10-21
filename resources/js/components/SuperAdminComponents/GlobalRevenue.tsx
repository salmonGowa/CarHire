import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import { DollarSign, Wallet, ArrowRightLeft } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { ksh, kshShort, longDate } from "@/lib/format";
import type { FinanceSummary, Paginated, Payout } from "@/types/models";

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function GlobalRevenue() {
  const { data: summary } = useApi<FinanceSummary>("/api/finance/summary?months=6");
  const { data, loading, error, reload } = useApi<Paginated<Payout>>("/api/payouts?per_page=10");
  const payouts = data?.data ?? [];
  const mtd = summary?.month_to_date;
  const ratePct = summary ? Math.round(summary.commission_rate * 100) : 10;
  const months = summary?.monthly ?? [];
  const maxCommission = Math.max(1, ...months.map((m) => m.commission));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Global Revenue & Payouts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform commissions and dealer disbursements.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Volume (MTD)</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{mtd ? kshShort(mtd.gross) : "—"}</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
          <div><p className="text-sm font-semibold text-emerald-100">Platform Cut ({ratePct}% ex-VAT)</p><h3 className="text-2xl font-black">{mtd ? ksh(mtd.commission) : "—"}</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><ArrowRightLeft className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Payouts</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary ? ksh(summary.payouts.pending_net) : "—"}</h3></div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-6">Platform Commission, Last 6 Months</h3>
        <div className="flex items-end justify-between gap-4 h-40 border-b border-slate-100 dark:border-slate-800 pb-2">
          {months.map((m) => (
            <div key={m.month} className="flex-1 h-full flex flex-col items-center justify-end gap-2 group relative">
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                {ksh(m.commission)} on {kshShort(m.gross)}
              </div>
              <div className="w-full max-w-[40px] rounded-t-lg bg-emerald-500" style={{ height: `${Math.max(2, (m.commission / maxCommission) * 100)}%` }} />
              <span className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Disbursements</h3>
        </div>
        <LoadState loading={loading} error={error} onRetry={reload} empty={payouts.length === 0 && "No payouts yet."}>
          <Table heads={["Payout", "Dealer", "Gross Volume", "Platform Cut", "Net Payout", "Status"]}>
            {payouts.map((p) => (
              <Tr key={p.id}>
                <Td label="Payout" className="font-bold text-slate-900 dark:text-slate-200">{p.reference}</Td>
                <Td label="Dealer" className="font-semibold text-slate-800 dark:text-slate-300">{p.dealer?.name}</Td>
                <Td label="Volume" className="text-slate-500 dark:text-slate-400 font-medium">{ksh(p.gross_collected + p.cash_collected)}</Td>
                <Td label="Platform Cut" className="text-emerald-600 dark:text-emerald-400 font-bold">{ksh(p.commission)}</Td>
                <Td label="Net Payout" className="text-slate-900 dark:text-slate-100 font-black">{ksh(p.net)}</Td>
                <Td label="Status">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    p.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  }`}>
                    {p.status === "paid" ? `Paid ${p.paid_at ? longDate(p.paid_at) : ""}` : "Pending Payout"}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>
    </motion.div>
  );
}
