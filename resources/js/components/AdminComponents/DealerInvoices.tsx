import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Info, Receipt, Search } from "lucide-react";
import { Table, Tr, Td } from "../Card";
import InvoiceDocument from "../InvoiceDocument";
import InvoiceStatusPill from "../InvoiceStatusPill";
import LoadState from "../LoadState";
import RecordPaymentModal, { type PaymentTarget } from "../RecordPaymentModal";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { ksh, longDate } from "@/lib/format";
import type { Invoice, InvoiceStatus, Paginated } from "@/types/models";

const FILTERS: { id: "" | "open" | InvoiceStatus; label: string }[] = [
  { id: "", label: "All" },
  { id: "open", label: "Balance due" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void" },
];

export default function DealerInvoices() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "open" | InvoiceStatus>("");
  const [viewing, setViewing] = useState<number | null>(null);
  const [paying, setPaying] = useState<PaymentTarget | null>(null);
  const term = useDebounced(search.trim());

  const query = new URLSearchParams({ per_page: "100", ...(term && { search: term }), ...(status && { status }) });
  const { data, loading, error, reload } = useApi<Paginated<Invoice>>(`/api/invoices?${query}`);
  const invoices = data?.data ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tax & Invoicing</h2>
          <p className="text-sm text-slate-500">A tax invoice is issued automatically when a booking is confirmed.</p>
        </div>
      </div>

      {/* ── KRA notice ── */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">KRA eTIMS not connected</p>
          <p className="text-xs text-slate-500 mt-1">Invoices show 16% VAT and your PIN, but aren't transmitted to KRA yet. File VAT returns from these figures until eTIMS integration is set up.</p>
        </div>
      </div>

      {/* ── Invoices Table ── */}
      <div className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search invoices" placeholder="Search by INV number or client..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20 transition-all" />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {FILTERS.map((f) => (
              <button key={f.id || "all"} onClick={() => setStatus(f.id)} aria-pressed={status === f.id}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${status === f.id ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={invoices.length === 0 && "No invoices match."}>
          <Table heads={["Invoice Details", "Date", "Subtotal", "VAT (16%)", "Grand Total", "Payment", "Actions"]}>
            {invoices.map((inv) => (
              <Tr key={inv.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><Receipt className="w-5 h-5" /></div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{inv.customer_name}</span>
                      <span className="text-[10px] font-mono font-black text-blue-500 tracking-wider uppercase">{inv.number}</span>
                    </div>
                  </div>
                </Td>
                <Td className="text-slate-500 font-bold text-xs">{longDate(inv.issued_at)}</Td>
                <Td className="text-slate-600 dark:text-slate-400 font-semibold">{ksh(inv.subtotal)}</Td>
                <Td className="text-rose-500 font-bold">{ksh(inv.vat)}</Td>
                <Td className="font-black text-slate-900 dark:text-white text-base">{ksh(inv.total)}</Td>
                <Td>
                  <div className="flex flex-col items-start gap-1">
                    <InvoiceStatusPill status={inv.status} />
                    {inv.balance > 0 && inv.status !== "void" && <span className="text-[10px] font-bold text-slate-500">{ksh(inv.balance)} due</span>}
                  </div>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {inv.can_record_payment && inv.balance > 0 && inv.status !== "void" && (
                      <button onClick={() => setPaying({ bookingId: inv.booking!.id, label: `${inv.number} · ${inv.customer_name}`, balance: inv.balance })}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300">
                        Record payment
                      </button>
                    )}
                    <button onClick={() => setViewing(inv.id)} aria-label={`View ${inv.number}`} title="View invoice" className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </div>

      <InvoiceDocument invoiceId={viewing} onClose={() => setViewing(null)} />
      <RecordPaymentModal key={paying?.bookingId ?? "none"} target={paying} onClose={() => setPaying(null)} onRecorded={reload} />
    </motion.div>
  );
}
