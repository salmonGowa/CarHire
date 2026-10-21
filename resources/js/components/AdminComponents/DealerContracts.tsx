import { useState } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import LoadState from "../LoadState";
import { FileSignature, Eye, CheckCircle2, Clock, UserRound, Search, Printer, X, PenLine } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { dateTime, ksh, longDate } from "@/lib/format";
import type { Agreement, AgreementStatus, Driver } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const STATUS: Record<AgreementStatus, { label: string; style: string }> = {
  pending_signature: { label: "Pending Signature", style: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  signed: { label: "Signed", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  closed: { label: "Closed", style: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  unsigned: { label: "Never signed", style: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" },
  void: { label: "Void", style: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500" },
};

interface AgreementList {
  data: Agreement[];
  summary: { signed_today: number; awaiting_signature: number; chauffeur_upcoming: number };
}

export default function DealerContracts() {
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Agreement | null>(null);
  const [message, setMessage] = useState("");
  const term = useDebounced(search.trim());

  const { data, setData, loading, error, reload } = useApi<AgreementList>(`/api/agreements${term ? `?search=${encodeURIComponent(term)}` : ""}`);
  const { data: driverData } = useApi<{ data: Driver[] }>("/api/drivers");
  const agreements = data?.data ?? [];
  const summary = data?.summary;
  const drivers = (driverData?.data ?? []).filter((d) => d.is_active);

  const replace = (updated: Agreement) => {
    setData((d) => d && { ...d, data: d.data.map((a) => (a.booking_id === updated.booking_id ? updated : a)) });
    if (viewing?.booking_id === updated.booking_id) setViewing(updated);
  };

  const setTerms = async (a: Agreement, agreement_type: Agreement["agreement_type"], driver_id: number | null) => {
    if (agreement_type === "chauffeur" && !driver_id) {
      // Show the driver picker; nothing to save until a driver is chosen.
      replace({ ...a, agreement_type, driver: null });
      return;
    }
    try {
      const { data: updated } = await api<{ data: Agreement }>(`/api/bookings/${a.booking_id}/agreement`, { method: "PUT", body: { agreement_type, driver_id } });
      replace(updated);
      setMessage("");
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
      reload();
    }
  };

  const sign = async (a: Agreement) => {
    if (!window.confirm(`Confirm ${a.customer.name} has signed agreement ${a.reference}?`)) return;
    try {
      const { data: updated } = await api<{ data: Agreement }>(`/api/bookings/${a.booking_id}/agreement/sign`, { method: "POST" });
      replace(updated);
      setMessage("");
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hire Agreements</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Every confirmed booking has an agreement. Set the hire type and get it signed at handover.</p>
        </div>
      </motion.div>

      {/* Analytics Summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Signed Today</p><h3 className="text-xl font-black text-slate-900 dark:text-white">{summary ? `${summary.signed_today} Agreement${summary.signed_today === 1 ? "" : "s"}` : "—"}</h3></div>
        </div>
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Waiting for Client</p><h3 className="text-xl font-black text-slate-900 dark:text-white">{summary ? `${summary.awaiting_signature} Pending` : "—"}</h3></div>
        </div>
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><UserRound className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Chauffeured (Open)</p><h3 className="text-xl font-black text-slate-900 dark:text-white">{summary ? `${summary.chauffeur_upcoming} Hire${summary.chauffeur_upcoming === 1 ? "" : "s"}` : "—"}</h3></div>
        </div>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search agreements" placeholder="Search client or booking reference..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20" />
      </div>

      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}

      {/* Contract Table */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload} empty={agreements.length === 0 && "No agreements yet. They're created when a booking is confirmed."}>
          <Table heads={["Contract", "Client Name", "Vehicle / Hire Type", "Period", "Status", "Actions"]}>
            {agreements.map((a) => (
              <Tr key={a.booking_id}>
                <Td label="Contract">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400"><FileSignature className="w-4 h-4" /></div>
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">{a.reference}</span>
                      <span className="text-[10px] font-mono text-slate-400">{a.booking_reference}</span>
                    </div>
                  </div>
                </Td>
                <Td label="Client" className="font-bold text-slate-900 dark:text-white">{a.customer.name}</Td>
                <Td label="Vehicle">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">{a.vehicle?.model}</span>
                  {a.editable ? (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <select aria-label="Hire type" value={a.agreement_type} onChange={(e) => setTerms(a, e.target.value as Agreement["agreement_type"], a.driver?.id ?? null)}
                        className="text-[11px] font-bold uppercase text-blue-600 dark:text-blue-400 bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-1 py-0.5">
                        <option value="self_drive">Self-drive</option>
                        <option value="chauffeur">Chauffeur</option>
                      </select>
                      {a.agreement_type === "chauffeur" && (
                        <select aria-label="Driver" value={a.driver?.id ?? ""} onChange={(e) => setTerms(a, "chauffeur", Number(e.target.value) || null)}
                          className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-1 py-0.5">
                          <option value="" disabled>Choose driver…</option>
                          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-blue-500 font-bold uppercase">{a.agreement_type === "chauffeur" ? `Chauffeur · ${a.driver?.name ?? "no driver"}` : "Self-Drive"}</span>
                  )}
                </Td>
                <Td label="Period" className="text-slate-500 dark:text-slate-400 font-medium text-xs">
                  {longDate(a.pickup_at)} – {longDate(a.return_at)}
                  <span className="block text-[10px]">{a.days} day{a.days === 1 ? "" : "s"}</span>
                </Td>
                <Td label="Status">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS[a.status].style}`}>{STATUS[a.status].label}</span>
                  {a.signed_at && <span className="block text-[10px] text-slate-400 mt-1">{dateTime(a.signed_at)}</span>}
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {a.status === "pending_signature" && (
                      <button onClick={() => sign(a)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 flex items-center gap-1">
                        <PenLine className="w-3.5 h-3.5" /> Mark signed
                      </button>
                    )}
                    <button onClick={() => setViewing(a)} aria-label={`View ${a.reference}`} title="View / print" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><Eye className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      {/* Agreement document */}
      <AnimatePresence>
        {viewing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:p-0 print:static">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewing(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm print:hidden" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              role="dialog" aria-modal="true" aria-label="Hire agreement"
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
                <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="w-3.5 h-3.5" /> Print</Button>
                <button onClick={() => setViewing(null)} aria-label="Close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div id="invoice-print" className="p-8 overflow-y-auto bg-[#fafafa] dark:bg-slate-950 text-slate-800 dark:text-slate-300 text-xs leading-relaxed custom-scrollbar rounded-b-3xl space-y-4">
                <div className="text-center border-b border-slate-300 dark:border-slate-700 pb-4">
                  <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-widest">Vehicle Hire Agreement</h2>
                  <p className="font-mono">{viewing.reference} · booking {viewing.booking_reference}</p>
                </div>
                <p><strong>Owner:</strong> {viewing.dealer?.name}, {viewing.dealer?.address ? `${viewing.dealer.address}, ` : ""}{viewing.dealer?.city}{viewing.dealer?.phone ? ` · ${viewing.dealer.phone}` : ""}</p>
                <p><strong>Hirer:</strong> {viewing.customer.name}{viewing.customer.id_number ? ` · ID ${viewing.customer.id_number}` : ""}{viewing.customer.phone ? ` · ${viewing.customer.phone}` : ""}</p>
                <p><strong>Vehicle:</strong> {viewing.vehicle?.model} ({viewing.vehicle?.plate})</p>
                <p><strong>Period:</strong> {dateTime(viewing.pickup_at)} to {dateTime(viewing.return_at)} ({viewing.days} day{viewing.days === 1 ? "" : "s"}), collected at {viewing.pickup_location}.</p>
                <p><strong>Hire type:</strong> {viewing.agreement_type === "chauffeur" ? `Chauffeur-driven by ${viewing.driver?.name ?? "(driver to be assigned)"}${viewing.driver ? `, licence class ${viewing.driver.license_class}` : ""}` : "Self-drive by the hirer"}.</p>
                <p><strong>Charges:</strong> {ksh(viewing.total)} including 16% VAT, as per the booking invoice.</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>The vehicle must be returned at the agreed time, with the same fuel level. Late returns are charged per started day.</li>
                  <li>{viewing.agreement_type === "chauffeur" ? "Only the assigned driver may drive the vehicle." : "Only the hirer, holding a valid driving licence, may drive the vehicle."}</li>
                  <li>The hirer is responsible for traffic fines and for damage caused by negligence during the hire period.</li>
                  <li>The vehicle may not leave Kenya, be sub-let, or be used for racing or carrying goods for hire.</li>
                </ol>
                <div className="grid grid-cols-2 gap-6 pt-6">
                  <div className="border-t border-slate-400 pt-2">Hirer signature{viewing.signed_at ? ` · signed ${dateTime(viewing.signed_at)}` : ""}</div>
                  <div className="border-t border-slate-400 pt-2">For {viewing.dealer?.name}</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
