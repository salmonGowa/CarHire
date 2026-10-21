import { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import LoadState from "../LoadState";
import {
  Wallet, Landmark, ArrowRightLeft, DollarSign,
  Download, Search, CheckCircle2, Clock,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { ksh, kshShort, longDate } from "@/lib/format";
import type { FinanceSummary, Paginated, Payout } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminPayouts() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "pending" | "paid">("");
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const term = useDebounced(search.trim());

  const { data: summary, reload: reloadSummary } = useApi<FinanceSummary>("/api/finance/summary?months=1");
  const query = new URLSearchParams({ per_page: "100", ...(term && { search: term }), ...(status && { status }) });
  const { data, setData, loading, error, reload } = useApi<Paginated<Payout>>(`/api/payouts?${query}`);
  const payouts = data?.data ?? [];
  const mtd = summary?.month_to_date;
  const ratePct = summary ? Math.round(summary.commission_rate * 100) : 10;

  const fail = (err: unknown) =>
    setMessage({ tone: "error", text: err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : "Couldn't reach the server." });

  const runCycle = async () => {
    if (!window.confirm("Settle every unsettled payment up to now into one payout per dealer?")) return;
    setRunning(true);
    try {
      const { data: created } = await api<{ data: Payout[] }>("/api/payouts/generate", { method: "POST" });
      setMessage({ tone: "ok", text: created.length ? `Created ${created.length} payout${created.length === 1 ? "" : "s"} totalling ${ksh(created.reduce((s, p) => s + p.net, 0))}.` : "Nothing to settle. Every payment is already in a payout." });
      reload();
      reloadSummary();
    } catch (err) {
      fail(err);
    } finally {
      setRunning(false);
    }
  };

  const markPaid = async (p: Payout) => {
    const ref = window.prompt(`Bank transfer reference for ${ksh(p.net)} to ${p.dealer?.name}:`);
    if (!ref?.trim()) return;
    try {
      const { data: updated } = await api<{ data: Payout }>(`/api/payouts/${p.id}/mark-paid`, { method: "POST", body: { transfer_reference: ref.trim() } });
      setData((d) => d && { ...d, data: d.data.map((x) => (x.id === updated.id ? updated : x)) });
      reloadSummary();
      setMessage({ tone: "ok", text: `${updated.reference} marked paid.` });
    } catch (err) {
      fail(err);
    }
  };

  const exportCsv = () =>
    downloadCsv(
      `payouts-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Reference", "Dealer", "Period start", "Period end", "Payments", "Collected", "Cash at dealer", "Commission", "Net", "Status", "Paid on", "Transfer ref"],
      payouts.map((p) => [p.reference, p.dealer?.name, p.period_start, p.period_end, p.payment_count, p.gross_collected, p.cash_collected, p.commission, p.net, p.status, p.paid_at?.slice(0, 10), p.transfer_reference]),
    );

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">

      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dealer Payouts</h2>
          <p className="text-sm text-slate-500 mt-1">Settle what the platform collected for each dealer, less its fee.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="gap-2" onClick={exportCsv} disabled={!payouts.length}><Download className="w-4 h-4" /> Export CSV</Button>
          <Button className="gap-2 shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-none" onClick={runCycle} loading={running}><Landmark className="w-4 h-4" /> Run Payout Cycle</Button>
        </div>
      </motion.div>

      {message && (
        <p className={`text-sm ${message.tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{message.text}</p>
      )}

      {/* ── Financial Split Matrix ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-[#060B14] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Gross Volume (MTD)</p>
          <h3 className="text-4xl font-black mb-4">{mtd ? kshShort(mtd.gross) : "—"}</h3>
          <div className="text-xs font-bold text-slate-400 mt-auto">{mtd ? `${mtd.count} payments this month` : "…"}</div>
        </div>

        <div className="p-6 rounded-[2rem] border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 flex flex-col justify-center">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4"><Wallet className="w-5 h-5" /></div>
          <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Platform Revenue ({ratePct}% ex-VAT, MTD)</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{mtd ? ksh(mtd.commission) : "—"}</h3>
        </div>

        <div className="p-6 rounded-[2rem] border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 flex flex-col justify-center">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4"><ArrowRightLeft className="w-5 h-5" /></div>
          <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Pending Remittances</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{summary ? ksh(summary.payouts.pending_net) : "—"}</h3>
          {summary && summary.payouts.unsettled_net !== 0 && (
            <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80 mt-1">+ {ksh(summary.payouts.unsettled_net)} not yet in a cycle</p>
          )}
        </div>
      </motion.div>

      {/* ── Settlement Ledger ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/20">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Settlement Queue</h3>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search dealer" placeholder="Search dealer..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value as "" | "pending" | "paid")} aria-label="Filter by status"
              className="py-2 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 outline-none">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={payouts.length === 0 && "No payouts yet. Run a payout cycle to settle collected payments."}>
          <Table heads={["Payout Ref & Dealer", "Period", "Collected", "Platform Cut", "Net Remittance", "Status", "Action"]}>
            {payouts.map((po) => (
              <Tr key={po.id}>
                <Td>
                  <span className="font-mono text-[10px] font-black text-slate-400 block mb-0.5">{po.reference}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{po.dealer?.name}</span>
                </Td>
                <Td className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {longDate(po.period_start)} – {longDate(po.period_end)}
                  <span className="block text-[10px] text-slate-400">{po.payment_count} payment{po.payment_count === 1 ? "" : "s"}</span>
                </Td>
                <Td className="font-bold text-slate-700 dark:text-slate-300">
                  {ksh(po.gross_collected)}
                  {po.cash_collected > 0 && <span className="block text-[10px] font-semibold text-slate-400">+{ksh(po.cash_collected)} cash at dealer</span>}
                </Td>
                <Td className="font-bold text-blue-600 dark:text-blue-400">-{ksh(po.commission)}</Td>
                <Td className={`font-black text-base ${po.net < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {ksh(po.net)}
                  {po.net < 0 && <span className="block text-[10px] font-bold">dealer owes platform</span>}
                </Td>
                <Td>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    po.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                  }`}>
                    {po.status === "paid" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {po.status === "paid" ? "Cleared" : "Pending Remittance"}
                  </span>
                  {po.transfer_reference && <span className="block text-[10px] font-mono text-slate-400 mt-1">{po.transfer_reference}</span>}
                </Td>
                <Td className="text-right">
                  {po.status === "pending" ? (
                    <Button size="sm" className="text-[10px] uppercase tracking-widest py-1.5 px-3" onClick={() => markPaid(po)}>Mark paid</Button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{po.paid_at ? longDate(po.paid_at) : "Done"}</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>
    </motion.div>
  );
}
