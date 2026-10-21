import { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import InvoiceDocument from "../InvoiceDocument";
import InvoiceStatusPill from "../InvoiceStatusPill";
import LoadState from "../LoadState";
import { Info, Receipt, Smartphone, Download, Banknote } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { PAYMENT_LABEL, ksh, longDate } from "@/lib/format";
import type { Invoice, Paginated, Payment } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CustomerBilling() {
  const [viewing, setViewing] = useState<number | null>(null);
  const { data, loading, error, reload } = useApi<Paginated<Invoice>>("/api/invoices?per_page=100");
  const { data: paymentData } = useApi<Paginated<Payment>>("/api/payments?per_page=5");
  const invoices = data?.data ?? [];
  const recentPayments = paymentData?.data ?? [];

  const open = invoices.filter((i) => i.status === "unpaid" || i.status === "partial");
  const outstanding = open.reduce((sum, i) => sum + i.balance, 0);

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">

      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Billing & Payments</h2>
          <p className="text-sm text-slate-500">Your invoices, what you've paid, and what's still due.</p>
        </div>
      </motion.div>

      {/* ── Financial Summary ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-[#0B1120] dark:to-slate-900 text-white shadow-xl border border-slate-800 flex flex-col justify-between">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Outstanding Balance</p>
          <h3 className="text-4xl font-black mb-2">{data ? ksh(outstanding) : "—"}</h3>
          <p className="text-xs text-slate-400">
            {open.length ? `Across ${open.length} booking${open.length === 1 ? "" : "s"}` : "You're all paid up."}
          </p>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-[2rem] border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600"><Info className="w-5 h-5" /></div>
              <p className="text-sm font-black text-slate-900 dark:text-white">How to pay</p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pay the dealer by M-PESA, card or cash when you collect the car. They record it here and your balance updates. Paying online in the app isn't available yet.
            </p>
          </div>

          <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent payments</p>
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-500">No payments yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {recentPayments.slice(0, 3).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 min-w-0">
                      {p.method === "mpesa" ? <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" /> : <Banknote className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span className="truncate">{longDate(p.paid_at)} · {PAYMENT_LABEL[p.method]}{p.status === "refunded" ? " (refunded)" : ""}</span>
                    </span>
                    <span className={`font-bold text-slate-900 dark:text-white ${p.status === "refunded" ? "line-through opacity-60" : ""}`}>{ksh(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Invoice History ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Billing History</h3>
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={invoices.length === 0 && "No invoices yet. You get one when a dealer confirms your booking."}>
          <Table heads={["Invoice Details", "Vehicle", "Amount", "Status", "Actions"]}>
            {invoices.map((inv) => (
              <Tr key={inv.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><Receipt className="w-5 h-5" /></div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{inv.number}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{longDate(inv.issued_at)} · {inv.dealer?.name}</span>
                    </div>
                  </div>
                </Td>
                <Td className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.booking?.vehicle?.model}</Td>
                <Td>
                  <span className="font-black text-slate-900 dark:text-white block">{ksh(inv.total)}</span>
                  {inv.balance > 0 && inv.status !== "void" && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{ksh(inv.balance)} due</span>}
                </Td>
                <Td><InvoiceStatusPill status={inv.status} /></Td>
                <Td className="text-right">
                  <button onClick={() => setViewing(inv.id)} className="flex items-center justify-end gap-1 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-blue-500 transition-all font-bold text-xs uppercase tracking-widest ml-auto group">
                    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> View / PDF
                  </button>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      <InvoiceDocument invoiceId={viewing} onClose={() => setViewing(null)} />
    </motion.div>
  );
}
