import { useState } from "react";
import LoadState from "../LoadState";
import BookingStatusPill from "../StatusPill";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { BOOKING_STATUS_LABEL, TRANSITION_ACTION, ksh, shortDate } from "@/lib/format";
import type { Booking, BookingStatus, Paginated, Stats } from "@/types/models";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import { 
  Search, AlertTriangle,
  Building2, Car, Calendar, ShieldAlert
} from "lucide-react";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminRentals() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | BookingStatus>("");
  const [message, setMessage] = useState("");
  const term = useDebounced(search.trim());
  const query = new URLSearchParams({ per_page: "100", ...(term && { search: term }), ...(status && { status }) });
  const { data, setData, loading, error, reload } = useApi<Paginated<Booking>>(`/api/bookings?${query}`);
  const { data: stats, reload: reloadStats } = useApi<Stats>("/api/stats");
  const rentals = data?.data ?? [];

  const changeStatus = async (booking: Booking, next: BookingStatus) => {
    if (next === "cancelled" && !window.confirm(`Cancel ${booking.reference}?`)) return;
    try {
      const { data: updated } = await api<{ data: Booking }>(`/api/bookings/${booking.id}/status`, { method: "PATCH", body: { status: next } });
      setData((d) => d && { ...d, data: d.data.map((b) => (b.id === updated.id ? updated : b)) });
      reloadStats();
      setMessage("");
    } catch (err) {
      setMessage(err instanceof ApiError ? (err.errors.status?.[0] ?? err.message) : "Couldn't reach the server.");
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Global Fleet Operations</h2>
          <p className="text-sm text-slate-500 mt-1">Cross-dealer rental monitoring and escalation management.</p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | BookingStatus)}
          aria-label="Filter by status"
          className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="">All statuses</option>
          {(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => <option key={s} value={s}>{BOOKING_STATUS_LABEL[s]}</option>)}
        </select>
      </motion.div>

      {/* ── Back Office KPIs ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600"><Car className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Platform Active Trips</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.bookings.active ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"><Calendar className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pickups (Next 7 Days)</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.bookings.upcoming_pickups ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600"><ShieldAlert className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-rose-600 uppercase tracking-widest">Overdue Returns</p><h3 className="text-2xl font-black text-rose-600">{stats?.bookings.overdue ?? "—"}</h3></div>
        </div>
      </motion.div>

      {/* ── Global Ledger Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search bookings"
                placeholder="Search by booking reference or customer..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" 
              />
           </div>
        </div>
        
        {message && <p className="px-6 pt-4 text-sm text-rose-600 dark:text-rose-400">{message}</p>}
        <LoadState loading={loading} error={error} onRetry={reload} empty={rentals.length === 0 && "No bookings match."}>
        <Table heads={["Booking Ref", "Dealership", "Customer & Car", "Schedule", "Amount", "Status", "Action"]}>
          {rentals.map((rental) => (
            <Tr key={rental.id}>
              <Td>
                <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">{rental.reference}</span>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{rental.dealer?.name}</span>
                </div>
              </Td>
              <Td>
                <span className="font-black text-slate-900 dark:text-white block">{rental.customer.name}</span>
                <span className="text-[10px] font-bold text-slate-500 mt-0.5">{rental.vehicle?.model} ({rental.vehicle?.plate})</span>
              </Td>
              <Td className="text-xs font-bold text-slate-600 dark:text-slate-400">{shortDate(rental.pickup_at)} - {shortDate(rental.return_at)}</Td>
              <Td className="font-black text-slate-900 dark:text-white">{ksh(rental.total)}</Td>
              <Td>
                <span className="inline-flex items-center gap-1.5">
                  {rental.is_overdue && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                  <BookingStatusPill booking={rental} />
                </span>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1 flex-wrap">
                  {rental.allowed_transitions.map((next) => (
                    <button key={next} onClick={() => changeStatus(rental, next)} className="px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                      {TRANSITION_ACTION[next]}
                    </button>
                  ))}
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
        </LoadState>
      </motion.div>
    </motion.div>
  );
}