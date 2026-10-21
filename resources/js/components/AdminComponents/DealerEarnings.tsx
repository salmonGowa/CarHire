import { type Variants, motion } from "framer-motion";
import { Activity, ArrowDownRight, ArrowUpRight, Download, Landmark, TrendingUp, Wallet } from "lucide-react";
import Button from "../Button";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import { downloadCsv } from "@/lib/csv";
import { useApi } from "@/lib/useApi";
import { ksh, kshShort, longDate, percentChange } from "@/lib/format";
import type { FinanceSummary, Paginated, Payout } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DealerEarnings() {
  const { data: summary } = useApi<FinanceSummary>("/api/finance/summary?months=6");
  const { data: payoutData, loading, error, reload } = useApi<Paginated<Payout>>("/api/payouts?per_page=50");
  const payouts = payoutData?.data ?? [];

  const months = summary?.monthly ?? [];
  const maxGross = Math.max(1, ...months.map((d) => d.gross));
  const mtd = summary?.month_to_date;
  const change = summary ? percentChange(summary.month_to_date.net, summary.previous_month.net) : null;
  const ratePct = summary ? Math.round(summary.commission_rate * 100) : 10;
  const awaiting = summary ? summary.payouts.unsettled_net + summary.payouts.pending_net : 0;

  const exportPayouts = () =>
    downloadCsv(
      `payouts-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Reference", "Period start", "Period end", "Payments", "Collected by platform", "Cash you took", "Platform fee", "Net", "Status", "Paid on", "Transfer ref"],
      payouts.map((p) => [p.reference, p.period_start, p.period_end, p.payment_count, p.gross_collected, p.cash_collected, p.commission, p.net, p.status, p.paid_at?.slice(0, 10), p.transfer_reference]),
    );

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Earnings & Payouts</h2>
          <p className="text-sm text-slate-500">What you've earned and what the platform has paid out to you.</p>
        </div>
        <Button onClick={exportPayouts} disabled={!payouts.length} className="flex items-center gap-2 shadow-blue-500/20"><Download className="w-4 h-4" /> Export Payouts</Button>
      </motion.div>

      {/* ── Financial Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Earnings Hero Card */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-emerald-100 text-xs font-black uppercase tracking-widest">Net Earnings (MTD)</p>
              <Wallet className="w-6 h-6 text-emerald-200" />
            </div>
            <h3 className="text-4xl font-black mb-2">{mtd ? ksh(mtd.net) : "—"}</h3>
            {change !== null && (
              <div className="flex items-center gap-2 text-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center bg-black/20 px-2 py-1 rounded-lg">
                  {change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />} {change >= 0 ? "+" : ""}{change}%
                </span>
                <span>vs Last Month</span>
              </div>
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-white/20 relative z-10 flex items-center justify-between gap-3 text-sm font-bold">
            <span>Awaiting payout:</span>
            <span className="text-white bg-black/20 px-3 py-1 rounded-xl">{summary ? ksh(awaiting) : "—"}</span>
          </div>
          <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 pointer-events-none" />
        </div>

        {/* Deductions Breakdown */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600"><Activity className="w-5 h-5" /></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Gross Received (MTD)</p>
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-4">{mtd ? ksh(mtd.gross) : "—"}</h3>
            </div>
            <div className="mt-6 text-[10px] font-bold text-slate-500">
              {mtd ? `${mtd.count} payment${mtd.count === 1 ? "" : "s"} this month` : "…"}
            </div>
          </div>

          <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-between hover:border-rose-500/50 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600"><Landmark className="w-5 h-5" /></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Deductions (MTD)</p>
              </div>
              <h3 className="text-3xl font-black text-rose-500 mt-4">{mtd ? ksh(mtd.commission + mtd.vat) : "—"}</h3>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Platform fee ({ratePct}% ex-VAT)</span><span className="text-slate-700 dark:text-slate-300">{mtd ? ksh(mtd.commission) : "—"}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>VAT you remit to KRA (16%)</span><span className="text-slate-700 dark:text-slate-300">{mtd ? ksh(mtd.vat) : "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Trend Chart ── */}
      <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Earnings Momentum</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700" /> Gross
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-3 h-3 rounded-md bg-emerald-500" /> Net Earnings
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between h-56 gap-2 sm:gap-6 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          {months.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-4 group relative h-full justify-end">
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black px-3 py-2 rounded-xl shadow-xl pointer-events-none z-10 flex flex-col items-center gap-1 whitespace-nowrap">
                <span className="text-emerald-400 dark:text-emerald-600">Net: {kshShort(d.net)}</span>
                <span className="text-[9px] text-slate-400">Gross: {kshShort(d.gross)}</span>
              </div>
              <div className="w-full max-w-[48px] flex items-end justify-center relative h-[85%]">
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.gross / maxGross) * 100}%` }} className="absolute bottom-0 w-full bg-slate-200 dark:bg-slate-700/80 rounded-t-xl" />
                <motion.div initial={{ height: 0 }} animate={{ height: `${(d.net / maxGross) * 100}%` }} className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl group-hover:brightness-110" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Payout History ── */}
      <motion.div variants={itemVariants} className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payout History</h3>
          <p className="text-xs text-slate-500 mt-0.5">The platform remits what it collected (M-PESA, card, bank) less its fee. Cash you took yourself is shown but not paid out.</p>
        </div>
        <LoadState loading={loading} error={error} onRetry={reload} empty={payouts.length === 0 && "No payouts yet. They're created when the platform runs a payout cycle."}>
          <Table heads={["Payout", "Period", "Collected by Platform", "Cash You Took", "Platform Fee", "Net to You", "Status"]}>
            {payouts.map((p) => (
              <Tr key={p.id}>
                <Td label="Payout">
                  <span className="font-mono font-bold text-blue-500 block">{p.reference}</span>
                  <span className="text-[10px] font-bold text-slate-400">{p.payment_count} payment{p.payment_count === 1 ? "" : "s"}</span>
                </Td>
                <Td label="Period" className="text-xs font-bold text-slate-500">{longDate(p.period_start)} – {longDate(p.period_end)}</Td>
                <Td label="Collected" className="text-slate-700 dark:text-slate-300 font-semibold">{ksh(p.gross_collected)}</Td>
                <Td label="Cash" className="text-slate-500 font-medium">{ksh(p.cash_collected)}</Td>
                <Td label="Fee" className="text-amber-500 font-bold">-{ksh(p.commission)}</Td>
                <Td label="Net" className={`font-black ${p.net < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {ksh(p.net)}{p.net < 0 && <span className="block text-[10px] font-bold">you owe the platform</span>}
                </Td>
                <Td label="Status">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"}`}>
                    {p.status === "paid" ? `Paid ${p.paid_at ? longDate(p.paid_at) : ""}` : "Processing"}
                  </span>
                  {p.transfer_reference && <span className="block text-[10px] font-mono text-slate-400 mt-1">{p.transfer_reference}</span>}
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>
    </motion.div>
  );
}
