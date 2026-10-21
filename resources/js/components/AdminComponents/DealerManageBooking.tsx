import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Search, Plus, Clock, User, ArrowRight, CreditCard, Wallet, AlertTriangle,
} from "lucide-react";
import Button from "../Button";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import BookingStatusPill from "../StatusPill";
import InvoiceStatusPill from "../InvoiceStatusPill";
import RecordPaymentModal, { type PaymentTarget } from "../RecordPaymentModal";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PAYMENT_LABEL, TRANSITION_ACTION, dateTime, ksh, shortDate } from "@/lib/format";
import type { Booking, BookingStatus, Paginated, Stats } from "@/types/models";

const VIEWS: { id: "all" | BookingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const ACTION_STYLE: Partial<Record<BookingStatus, string>> = {
  confirmed: "bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20",
  active: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20",
  completed: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20",
  cancelled: "text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10",
};

export default function DealerManageBooking() {
  const navigate = useNavigate();
  const [view, setView] = useState<"all" | BookingStatus>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [paying, setPaying] = useState<PaymentTarget | null>(null);

  const query = new URLSearchParams({ per_page: "200", ...(view !== "all" && { status: view }) });
  const { data, setData, loading, error, reload } = useApi<Paginated<Booking>>(`/api/bookings?${query}`);
  const { data: stats, reload: reloadStats } = useApi<Stats>("/api/stats");

  const q = search.trim().toLowerCase();
  const filteredBookings = (data?.data ?? []).filter(
    (b) => !q || b.customer.name.toLowerCase().includes(q) || b.reference.toLowerCase().includes(q),
  );

  const changeStatus = async (booking: Booking, status: BookingStatus) => {
    if (status === "cancelled" && !window.confirm(`Cancel booking ${booking.reference} for ${booking.customer.name}?`)) return;
    setBusyId(booking.id);
    setActionError("");
    try {
      const { data: updated } = await api<{ data: Booking }>(`/api/bookings/${booking.id}/status`, { method: "PATCH", body: { status } });
      setData((d) => d && {
        ...d,
        // Drop the row if it no longer matches the current tab.
        data: d.data.flatMap((b) => (b.id !== updated.id ? [b] : view === "all" || view === updated.status ? [updated] : [])),
      });
      reloadStats();
    } catch (err) {
      setActionError(err instanceof ApiError ? (err.errors.status?.[0] ?? err.message) : "Couldn't reach the server.");
    } finally {
      setBusyId(null);
    }
  };

  // After a payment, refetch so the row's invoice balance and status are current.
  const onRecorded = () => {
    reload();
    reloadStats();
  };

  const nextPickup = stats?.bookings.next_pickup_at;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      {/* ── Header Area ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Booking Manager</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Confirm requests, hand over keys, and check vehicles back in.
          </p>
        </div>
        <Button onClick={() => navigate("/admin-add-booking")} className="flex items-center gap-2 px-6 py-3 shadow-blue-500/25">
          <Plus className="w-5 h-5" /> New Booking
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          {VIEWS.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              aria-pressed={view === t.id}
              className={`px-4 sm:px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === t.id
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search client or reference..."
            aria-label="Search bookings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-200 focus:ring-2 ring-blue-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl text-sm bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {actionError}
        </div>
      )}

      {/* ── Main Bookings Table ── */}
      <div className="rounded-[2.5rem] border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <LoadState
          loading={loading}
          error={error}
          onRetry={reload}
          empty={filteredBookings.length === 0 && (
            <span className="flex flex-col items-center gap-3">
              <ClipboardList className="w-12 h-12 text-slate-200 dark:text-slate-800" />
              No bookings found in this category.
            </span>
          )}
        >
          <Table heads={["Booking Details", "Schedule", "Amount & Payment", "Status", "Actions"]}>
            {filteredBookings.map((b) => (
              <Tr key={b.id}>
                <Td label="Booking Details">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">{b.customer.name}</span>
                      <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-tighter">
                        {b.reference} • {b.vehicle?.model} ({b.vehicle?.plate})
                      </span>
                    </div>
                  </div>
                </Td>

                <Td label="Schedule">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300" title={dateTime(b.pickup_at)}>{shortDate(b.pickup_at)}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Return</span>
                      <span className={`text-sm font-bold ${b.is_overdue ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`} title={dateTime(b.return_at)}>{shortDate(b.return_at)}</span>
                    </div>
                  </div>
                </Td>

                <Td label="Financials">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{ksh(b.total)}</span>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-slate-500">
                      {b.invoice ? (
                        <>
                          <InvoiceStatusPill status={b.invoice.status} />
                          {b.invoice.balance > 0 && b.invoice.status !== "void" && <span>{ksh(b.invoice.balance)} due</span>}
                        </>
                      ) : (
                        <><CreditCard className="w-3 h-3" /> {b.payment_method ? PAYMENT_LABEL[b.payment_method] : "Not set"} · not invoiced</>
                      )}
                    </div>
                  </div>
                </Td>

                <Td label="Status">
                  <BookingStatusPill booking={b} />
                </Td>

                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {b.can_record_payment && b.invoice && b.invoice.balance > 0 && (
                      <button
                        onClick={() => setPaying({ bookingId: b.id, label: `${b.reference} · ${b.customer.name}`, balance: b.invoice!.balance })}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                      >
                        Record payment
                      </button>
                    )}
                    {b.allowed_transitions.length === 0 && !(b.can_record_payment && b.invoice && b.invoice.balance > 0) && <span className="text-xs text-slate-400">—</span>}
                    {b.allowed_transitions.map((next) => (
                      <button
                        key={next}
                        disabled={busyId === b.id}
                        onClick={() => changeStatus(b, next)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${ACTION_STYLE[next] ?? ""}`}
                      >
                        {TRANSITION_ACTION[next]}
                      </button>
                    ))}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </div>

      <RecordPaymentModal key={paying?.bookingId ?? "none"} target={paying} onClose={() => setPaying(null)} onRecorded={onRecorded} />

      {/* ── Operational Insights (Footer) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Pickup</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">{nextPickup ? dateTime(nextPickup) : "None scheduled"}</h4>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Needs Attention</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {stats ? `${stats.bookings.pending} pending · ${stats.bookings.overdue} overdue` : "—"}
            </h4>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">Value of Active Rentals</p>
            <h4 className="text-xl font-black">{stats ? ksh(stats.revenue.active_value) : "—"}</h4>
          </div>
          <Wallet className="w-6 h-6 text-blue-200" />
        </div>
      </div>
    </motion.div>
  );
}
