import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import InvoiceDocument from "../InvoiceDocument";
import InvoiceStatusPill from "../InvoiceStatusPill";
import LoadState from "../LoadState";
import PayNowModal, { type PayTarget } from "../PayNowModal";
import { CheckCircle2, CreditCard, Info, Loader2, Receipt, Smartphone, Download, Banknote, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useOnlinePayment } from "@/lib/useOnlinePayment";
import { PAYMENT_LABEL, ksh, longDate } from "@/lib/format";
import type { Profile } from "@/types/account";
import type { Invoice, OnlinePayment, Paginated, Payment } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const PAYABLE = ["confirmed", "active", "completed"];

/** Coming back from a card checkout (?payment=id): show how it went. */
function ReturnBanner({ id, onSettled }: { id: number; onSettled: () => void }) {
  const [initial, setInitial] = useState<OnlinePayment | null>(null);
  useEffect(() => {
    api<{ data: OnlinePayment }>(`/api/online-payments/${id}`).then(({ data }) => {
      setInitial(data);
      if (data.status !== "pending") onSettled();
    }).catch(() => {});
  }, [id, onSettled]);
  const payment = useOnlinePayment(initial, onSettled);
  if (!payment) return null;
  const tone = payment.status === "succeeded" ? "emerald" : payment.status === "pending" ? "blue" : "rose";
  const Icon = payment.status === "succeeded" ? CheckCircle2 : payment.status === "pending" ? Loader2 : XCircle;
  return (
    <motion.div variants={itemVariants} role="status" className={`flex items-start gap-3 p-4 rounded-2xl border text-sm
      ${tone === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300"
        : tone === "blue" ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300"
        : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300"}`}>
      <Icon className={`w-5 h-5 shrink-0 ${payment.status === "pending" ? "animate-spin" : ""}`} />
      <span>
        {payment.status === "succeeded" ? <><strong>{ksh(payment.amount)} paid by card</strong> for {payment.booking?.reference}. Your receipt is below.</>
          : payment.status === "pending" ? <>Confirming your card payment of {ksh(payment.amount)}…</>
          : <><strong>The card payment didn't go through.</strong> {payment.message ?? "No money was taken."} You can try again.</>}
      </span>
    </motion.div>
  );
}

export default function CustomerBilling() {
  const [viewing, setViewing] = useState<number | null>(null);
  const [paying, setPaying] = useState<PayTarget | null>(null);
  const [params] = useSearchParams();
  const returned = Number(params.get("payment")) || null;
  const { data, loading, error, reload } = useApi<Paginated<Invoice>>("/api/invoices?per_page=100");
  const { data: paymentData, reload: reloadPayments } = useApi<Paginated<Payment>>("/api/payments?per_page=5");
  const { data: profile } = useApi<{ data: Profile }>("/api/profile");
  const refresh = useCallback(() => { reload(); reloadPayments(); }, [reload, reloadPayments]);
  const payTarget = (inv: Invoice): PayTarget | null => inv.booking && inv.balance > 0 && inv.status !== "void" && PAYABLE.includes(inv.booking.status)
    ? { bookingId: inv.booking.id, reference: inv.booking.reference, balance: inv.balance, phone: profile?.data.preferences.mpesa_phone ?? profile?.data.phone, allowCard: true }
    : null;
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

      {returned && <ReturnBanner id={returned} onSettled={refresh} />}

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
              Use <strong>Pay</strong> on an invoice to pay by M-PESA (a prompt comes to your phone) or by card. You can also pay the dealer in cash at pickup; they record it here.
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
                      {p.method === "mpesa" ? <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" /> : p.method === "card" ? <CreditCard className="w-4 h-4 text-blue-500 shrink-0" /> : <Banknote className="w-4 h-4 text-slate-400 shrink-0" />}
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
                  <div className="flex items-center justify-end gap-1">
                    {payTarget(inv) && (
                      <button onClick={() => setPaying(payTarget(inv))} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                        <CreditCard className="w-3.5 h-3.5" /> Pay {ksh(inv.balance)}
                      </button>
                    )}
                    <button onClick={() => setViewing(inv.id)} className="flex items-center justify-end gap-1 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-blue-500 transition-all font-bold text-xs uppercase tracking-widest group">
                      <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> View / PDF
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      <InvoiceDocument invoiceId={viewing} onClose={() => setViewing(null)} />
      <PayNowModal target={paying} onClose={() => setPaying(null)} onPaid={refresh} />
    </motion.div>
  );
}
