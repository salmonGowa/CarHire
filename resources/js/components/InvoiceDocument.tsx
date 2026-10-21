import { AnimatePresence, motion } from "framer-motion";
import { Building2, Printer, X } from "lucide-react";
import Button from "./Button";
import InvoiceStatusPill from "./InvoiceStatusPill";
import LoadState from "./LoadState";
import { useApi } from "@/lib/useApi";
import { PAYMENT_LABEL, dateTime, ksh, longDate } from "@/lib/format";
import type { Invoice } from "@/types/models";

/** Printable tax invoice / receipt, loaded with its payments. */
export default function InvoiceDocument({ invoiceId, onClose }: { invoiceId: number | null; onClose: () => void }) {
  const { data, loading, error, reload } = useApi<{ data: Invoice }>(invoiceId ? `/api/invoices/${invoiceId}` : null);
  const inv = invoiceId && data?.data.id === invoiceId ? data.data : null;

  return (
    <AnimatePresence>
      {invoiceId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:p-0 print:static">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm print:hidden" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog" aria-modal="true" aria-label="Invoice"
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
              <Button variant="secondary" size="sm" onClick={() => window.print()} disabled={!inv}><Printer className="w-3.5 h-3.5" /> Print / Save PDF</Button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" aria-label="Close"><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div id="invoice-print" className="p-8 overflow-y-auto bg-[#fafafa] dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-mono text-xs custom-scrollbar rounded-b-3xl">
              {!inv ? (
                <LoadState loading={loading} error={error} onRetry={reload} />
              ) : (
                <>
                  <div className="text-center border-b-2 border-dashed border-slate-300 dark:border-slate-700 pb-6 mb-6">
                    <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-900 dark:text-white" />
                    <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-widest">{inv.dealer?.name}</h2>
                    {inv.dealer?.address && <p>{inv.dealer.address}</p>}
                    <p>{inv.dealer?.city}, KE{inv.dealer?.phone ? ` · ${inv.dealer.phone}` : ""}</p>
                    <p>PIN: {inv.dealer?.tax_pin ?? "not on file"}</p>
                    <p className="mt-4 font-bold text-sm">TAX INVOICE</p>
                  </div>

                  <div className="flex justify-between mb-6">
                    <div>
                      <p>Date: {longDate(inv.issued_at)}</p>
                      <p>Booking: {inv.booking?.reference}</p>
                    </div>
                    <div className="text-right">
                      <p>INV NO: {inv.number}</p>
                      <div className="mt-1"><InvoiceStatusPill status={inv.status} /></div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold border-b border-slate-300 dark:border-slate-700 pb-1 mb-2">Billed To:</p>
                    <p>{inv.customer_name}</p>
                    {inv.booking?.customer_phone && <p>{inv.booking.customer_phone}</p>}
                    {inv.booking?.customer_email && <p>{inv.booking.customer_email}</p>}
                  </div>

                  <table className="w-full mb-6">
                    <thead className="border-y border-slate-300 dark:border-slate-700 text-left">
                      <tr><th className="py-2">Description</th><th className="py-2 text-right">Amt (KSh)</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2">
                          Vehicle hire: {inv.booking?.vehicle?.model} ({inv.booking?.vehicle?.plate})<br />
                          {inv.booking?.days} day{inv.booking?.days === 1 ? "" : "s"} × {inv.booking && inv.booking.daily_rate.toLocaleString()}
                          {inv.booking && <><br />{dateTime(inv.booking.pickup_at)} → {dateTime(inv.booking.return_at)}</>}
                        </td>
                        <td className="py-2 text-right align-top">{inv.subtotal.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="space-y-1 text-right mb-6">
                    <p>SUBTOTAL: {inv.subtotal.toLocaleString()}</p>
                    <p>VAT (16%): {inv.vat.toLocaleString()}</p>
                    <p className="text-lg font-black border-t-2 border-dashed border-slate-300 dark:border-slate-700 pt-2 mt-2 text-slate-900 dark:text-white">TOTAL: {inv.total.toLocaleString()}</p>
                    <p>PAID: {inv.amount_paid.toLocaleString()}</p>
                    <p className="font-bold">BALANCE DUE: {inv.balance.toLocaleString()}</p>
                  </div>

                  {inv.payments && inv.payments.length > 0 && (
                    <div className="mb-6">
                      <p className="font-bold border-b border-slate-300 dark:border-slate-700 pb-1 mb-2">Payments</p>
                      {inv.payments.map((p) => (
                        <div key={p.id} className="flex justify-between py-0.5">
                          <span>{longDate(p.paid_at)} · {PAYMENT_LABEL[p.method]}{p.transaction_code ? ` ${p.transaction_code}` : ""}{p.status === "refunded" ? " (refunded)" : ""}</span>
                          <span className={p.status === "refunded" ? "line-through" : ""}>{ksh(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-center border-t border-slate-300 dark:border-slate-700 pt-6">
                    <p className="text-[10px] text-slate-500">Not yet submitted to KRA eTIMS. Electronic tax registration is not connected.</p>
                    <p className="mt-4 font-bold uppercase">Thank you for your business!</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
