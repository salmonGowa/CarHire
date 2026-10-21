import { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Download, Search } from "lucide-react";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import { api, ApiError } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { PAYMENT_LABEL, ksh, longDate, percentChange } from "@/lib/format";
import type { FinanceSummary, Paginated, Payment } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

/** Dealer "Payments": money received, the platform fee taken, and the ledger of payments. */
export default function DealerRevenue() {
  const [search, setSearch] = useState("");
  const term = useDebounced(search.trim());
  const [message, setMessage] = useState("");

  const { data: summary, reload: reloadSummary } = useApi<FinanceSummary>("/api/finance/summary?months=6");
  const query = new URLSearchParams({ per_page: "100", ...(term && { search: term }) });
  const { data, setData, loading, error, reload } = useApi<Paginated<Payment>>(`/api/payments?${query}`);
  const payments = data?.data ?? [];

  const months = summary?.monthly ?? [];
  const maxGross = Math.max(1, ...months.map((m) => m.gross));
  const mtd = summary?.month_to_date;
  const change = summary ? percentChange(summary.month_to_date.gross, summary.previous_month.gross) : null;
  const ratePct = summary ? Math.round(summary.commission_rate * 100) : 10;

  const refund = async (p: Payment) => {
    if (!window.confirm(`Refund ${ksh(p.amount)} (${p.reference})? Make sure the money has been returned to the customer.`)) return;
    try {
      const { data: updated } = await api<{ data: Payment }>(`/api/payments/${p.id}/refund`, { method: "POST" });
      setData((d) => d && { ...d, data: d.data.map((x) => (x.id === updated.id ? updated : x)) });
      reloadSummary();
      setMessage("");
    } catch (err) {
      setMessage(err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : "Couldn't reach the server.");
    }
  };

  const exportLedger = () =>
    downloadCsv(
      `payments-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Reference", "Date", "Booking", "Client", "Method", "Transaction code", "Amount", "VAT", "Platform fee", "Dealer net", "Status", "Settled"],
      payments.map((p) => [
        p.reference, p.paid_at.slice(0, 10), p.booking?.reference, p.booking?.customer_name, PAYMENT_LABEL[p.method],
        p.transaction_code, p.amount, p.vat, p.commission, p.dealer_net, p.status, p.settled ? "yes" : "no",
      ]),
    );

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payments</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Money received for your bookings, after VAT and the platform fee.</p>
        </div>
        <button onClick={exportLedger} disabled={!payments.length} className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-950 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">
          <Download className="w-4 h-4" /> Export Ledger
        </button>
      </motion.div>

      {/* Analytics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 dark:text-white">6-Month Payments Received</h3>
            {change !== null && (
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${change >= 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10"}`}>
                {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {change >= 0 ? "+" : ""}{change}% vs last month
              </div>
            )}
          </div>

          <div className="flex-1 flex items-end justify-between gap-4 h-48 border-b border-slate-100 dark:border-slate-800 pb-2">
            {months.map((m, idx) => (
              <div key={m.month} className="flex flex-col items-center gap-3 w-full h-full justify-end group relative">
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap">
                  {ksh(m.gross)} · {m.count} payment{m.count === 1 ? "" : "s"}
                </div>
                <div
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${idx === months.length - 1 ? "bg-blue-500" : "bg-blue-400"}`}
                  style={{ height: `${Math.max(2, (m.gross / maxGross) * 100)}%` }}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Column */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl border bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <p className="text-xs font-bold uppercase text-blue-100 tracking-widest mb-1">Received This Month</p>
            <h3 className="text-2xl font-black">{mtd ? ksh(mtd.gross) : "—"}</h3>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-xs font-bold text-blue-100">
              <div className="flex items-center justify-between"><span>VAT (to KRA)</span><span>- {mtd ? ksh(mtd.vat) : "—"}</span></div>
              <div className="flex items-center justify-between"><span>Platform fee ({ratePct}% ex-VAT)</span><span>- {mtd ? ksh(mtd.commission) : "—"}</span></div>
            </div>
          </div>
          <div className="p-6 rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Your Net (MTD)</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{mtd ? ksh(mtd.net) : "—"}</h3>
            <p className="mt-3 text-xs text-slate-500">
              {summary ? <>Still owed by customers: <span className="font-bold text-amber-600 dark:text-amber-400">{ksh(summary.outstanding)}</span></> : "…"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Transactions Table */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Ledger</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Client, booking or M-PESA code..." aria-label="Search payments"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20" />
          </div>
        </div>
        {message && <p className="px-6 pt-4 text-sm text-rose-600 dark:text-rose-400">{message}</p>}
        <LoadState loading={loading} error={error} onRetry={reload} empty={payments.length === 0 && (term ? "No payments match." : "No payments yet. Record them from the Booking Manager.")}>
          <Table heads={["Payment", "Client", "Amount", "Platform Fee", "Your Net", "Status", ""]}>
            {payments.map((p) => (
              <Tr key={p.id}>
                <Td label="Payment">
                  <span className="font-mono font-bold text-blue-500 block">{p.reference}</span>
                  <span className="text-[10px] font-bold text-slate-400">{longDate(p.paid_at)} · {PAYMENT_LABEL[p.method]}{p.transaction_code ? ` ${p.transaction_code}` : ""}</span>
                </Td>
                <Td label="Client">
                  <span className="font-bold text-slate-900 dark:text-white block">{p.booking?.customer_name}</span>
                  <span className="text-[10px] font-bold text-slate-400">{p.booking?.reference} · {p.booking?.vehicle}</span>
                </Td>
                <Td label="Amount" className="text-slate-700 dark:text-slate-300 font-semibold">{ksh(p.amount)}</Td>
                <Td label="Platform Fee" className="text-rose-500 font-bold">-{ksh(p.commission ?? 0)}</Td>
                <Td label="Your Net" className="text-emerald-600 dark:text-emerald-400 font-black">{ksh(p.dealer_net ?? 0)}</Td>
                <Td label="Status">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    p.status === "refunded" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                      : p.settled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                  }`}>
                    {p.status === "refunded" ? "Refunded" : p.settled ? "Settled" : "Awaiting payout"}
                  </span>
                </Td>
                <Td className="text-right">
                  {p.can_refund && (
                    <button onClick={() => refund(p)} className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10">Refund</button>
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
