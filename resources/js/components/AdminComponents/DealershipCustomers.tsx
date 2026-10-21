import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import LoadState from "../LoadState";
import BookingStatusPill from "../StatusPill";
import { Search, Users, Mail, Phone, X, History, Plus, Repeat, Wallet, UserRound } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { ksh, longDate } from "@/lib/format";
import type { DealerCustomer } from "@/types/models";

export default function DealershipCustomers() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<DealerCustomer | null>(null);
  const [search, setSearch] = useState("");
  const term = useDebounced(search.trim());

  const { data, loading, error, reload } = useApi<{ data: DealerCustomer[]; summary: { total: number; repeat: number; with_balance: number; outstanding: number } }>(
    `/api/dealer-customers${term ? `?search=${encodeURIComponent(term)}` : ""}`,
  );
  const customers = data?.data ?? [];
  const summary = data?.summary;

  const statusOf = (c: DealerCustomer) =>
    c.outstanding > 0 ? { label: "Balance due", style: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" }
      : c.completed_trips >= 2 ? { label: "Repeat", style: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" }
      : { label: c.completed_trips ? "Returning" : "New", style: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };

  return (
    <div className="relative h-full space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Customer Hub</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Everyone who has booked with you, from app accounts to walk-ins.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => navigate("/admin-add-booking")}><Plus className="w-5 h-5" /> New Booking</Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><Users className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Clients</p><h3 className="text-xl font-black text-slate-900 dark:text-white">{summary?.total.toLocaleString() ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Repeat className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Repeat Renters</p><h3 className="text-xl font-black text-slate-900 dark:text-white">{summary?.repeat ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Owed by Customers</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{summary ? ksh(summary.outstanding) : "—"}</h3>
            {summary && summary.with_balance > 0 && <p className="text-[10px] font-bold text-slate-400">{summary.with_balance} with a balance</p>}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          placeholder="Search by name, email or phone..." aria-label="Search customers"
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <LoadState loading={loading} error={error} onRetry={reload} empty={customers.length === 0 && (term ? "No customers match." : "No customers yet. They appear here once they book.")}>
          <Table heads={["Customer", "Contact", "Usage", "Status", "Last Booking"]}>
            {customers.map((c) => {
              const status = statusOf(c);
              return (
                <Tr key={c.key} onClick={() => setSelected(c)}>
                  <Td label="Customer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{c.has_account ? "App account" : "Walk-in"}</span>
                      </div>
                    </div>
                  </Td>
                  <Td label="Contact">
                    <div className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-400">
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                    </div>
                  </Td>
                  <Td label="Usage">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{ksh(c.total_spent)}</span>
                      <span className="text-[10px] font-bold text-blue-500 uppercase">{c.trips} Trip{c.trips === 1 ? "" : "s"}</span>
                    </div>
                  </Td>
                  <Td label="Status">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.style}`}>{status.label}</span>
                  </Td>
                  <Td label="Last Booking" className="text-xs font-medium text-slate-500">
                    {longDate(c.last_booking_at)}
                    {c.last_vehicle && <span className="block text-[10px]">{c.last_vehicle}</span>}
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </LoadState>
      </div>

      {/* ── Customer Detail Drawer (Side Panel) ── */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              role="dialog" aria-modal="true" aria-label={selected.name}
              className="fixed right-0 top-0 h-full w-full max-w-md z-[120] bg-white dark:bg-[#0B1120] border-l border-slate-200 dark:border-slate-800 shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setSelected(null)} aria-label="Close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20">
                  {selected.name.charAt(0)}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{selected.name}</h3>
                <p className="text-sm font-bold text-slate-400 mt-2 flex items-center justify-center gap-1.5">
                  <UserRound className="w-4 h-4" /> {selected.has_account ? "App account" : "Walk-in client"} · since {longDate(selected.first_booking_at)}
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Quick Insights</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Total Paid</p><p className="text-lg font-black text-emerald-500">{ksh(selected.total_spent)}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Outstanding</p><p className={`text-lg font-black ${selected.outstanding ? "text-amber-500" : "text-slate-400"}`}>{ksh(selected.outstanding)}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Completed Trips</p><p className="text-lg font-black text-blue-500">{selected.completed_trips}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Cancellations</p><p className="text-lg font-black text-slate-700 dark:text-slate-300">{selected.cancellations}</p></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Booking History
                  </h4>
                  <div className="space-y-3">
                    {selected.bookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">{b.reference}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{longDate(b.pickup_at)} · {b.vehicle}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-sm font-black text-slate-900 dark:text-white">{ksh(b.total)}</span>
                          <BookingStatusPill booking={{ status: b.status, is_overdue: false }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button fullWidth className="py-4 rounded-2xl text-base font-black uppercase tracking-widest" onClick={() => navigate("/admin-add-booking")}>
                  New Booking
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
