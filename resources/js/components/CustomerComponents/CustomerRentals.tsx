import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { BOOKING_STATUS_LABEL, dateTime, ksh, longDate } from "@/lib/format";
import type { Booking, Paginated, Stats } from "@/types/models";
import LoadState from "../LoadState";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import { 
  Car, Calendar, DollarSign, Star, ChevronRight, 
  RefreshCw, CheckCircle2, Clock, XCircle, MapPin, Search, KeyRound
} from "lucide-react";

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

// Customers think in "upcoming" rather than pending vs confirmed.
const FILTERS = ["All", "Upcoming", "Active", "Completed", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const matches = (b: Booking, f: Filter) =>
  f === "All" ||
  (f === "Upcoming" && (b.status === "pending" || b.status === "confirmed")) ||
  b.status === f.toLowerCase();

const statusLabel = (b: Booking) =>
  b.is_overdue ? "Overdue" : b.status === "pending" ? "Awaiting confirmation" : BOOKING_STATUS_LABEL[b.status];

export default function CustomerRentals() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const { data, setData, loading, error, reload } = useApi<Paginated<Booking>>("/api/bookings?per_page=200");
  const { data: stats, reload: reloadStats } = useApi<Stats>("/api/stats");

  const rentals = data?.data ?? [];
  const filteredRentals = rentals.filter((r) => matches(r, filter));

  const trips = stats?.trips;
  const summary = {
    total: trips?.completed ?? 0,
    spend: trips?.total_spent ?? 0,
    days: trips?.days ?? 0,
    avgRating: trips?.average_rating ? trips.average_rating.toFixed(1) : "—",
  };

  const replace = (updated: Booking) =>
    setData((d) => d && { ...d, data: d.data.map((b) => (b.id === updated.id ? updated : b)) });

  const fail = (err: unknown) =>
    setMessage(err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : "Couldn't reach the server.");

  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savedReview, setSavedReview] = useState<number | null>(null);

  const rate = async (booking: Booking, rating: number, review?: string) => {
    const previous = booking;
    replace({ ...booking, rating, ...(review !== undefined && { review }) });
    try {
      const { data: updated } = await api<{ data: Booking }>(`/api/bookings/${booking.id}/rating`, { method: "PUT", body: { rating, ...(review !== undefined && { review: review.trim() || null }) } });
      if (review !== undefined) {
        setSavedReview(booking.id);
        setTimeout(() => setSavedReview(null), 2000);
      }
      replace(updated);
      reloadStats();
    } catch (err) {
      replace(previous);
      fail(err);
    }
  };

  const cancel = async (booking: Booking) => {
    if (!window.confirm(`Cancel your ${booking.vehicle?.model} booking (${booking.reference})?`)) return;
    try {
      const { data: updated } = await api<{ data: Booking }>(`/api/bookings/${booking.id}/status`, { method: "PATCH", body: { status: "cancelled" } });
      replace(updated);
      setMessage("");
    } catch (err) {
      fail(err);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Rental History</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your upcoming trips and review past rentals.</p>
        </div>
      </motion.div>

      {/* ── Summary Stats Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Completed Trips", value: summary.total, icon: Car, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Total Spent", value: ksh(summary.spend), icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Days Driven", value: summary.days, icon: Calendar, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
          { label: "Avg Rating", value: summary.avgRating, icon: Star, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg} ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <h3 className={`text-xl sm:text-2xl font-black leading-none ${s.color}`}>{s.value}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Filter Tabs ── */}
      <motion.div variants={itemVariants} className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
              filter === f 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md" 
                : "bg-white dark:bg-[#0B1120] text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            {f}
          </button>
        ))}
      </motion.div>

      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}

      {/* ── Rental List ── */}
      <motion.div variants={itemVariants} className="space-y-4">
        {(loading || error) && <LoadState loading={loading} error={error} onRetry={reload} />}
        {filteredRentals.map((r) => {
          const isOpen = expandedId === r.id;
          const userRating = r.rating ?? 0;
          const done = r.status === "completed";
          const upcoming = r.status === "pending" || r.status === "confirmed";

          return (
            <motion.div layout key={r.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] rounded-[2rem] overflow-hidden shadow-sm hover:border-blue-500/50 transition-colors">
              
              {/* Visible Row */}
              <button onClick={() => setExpandedId(isOpen ? null : r.id)} aria-expanded={isOpen} className="w-full flex items-center gap-4 p-5 sm:p-6 text-left focus:outline-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                  {r.vehicle?.image_url ? <img src={r.vehicle.image_url} alt="" className="w-full h-full object-cover" /> : <Car className="w-6 h-6" />}
                </div>
                
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <div className="min-w-0">
                    <p className="text-base font-black text-slate-900 dark:text-white truncate leading-tight">{r.vehicle?.model}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> {r.dealer?.name}
                    </p>
                  </div>
                  
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{longDate(r.pickup_at)}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{r.days} Day{r.days === 1 ? "" : "s"} Total</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                     <div className="text-left sm:text-right">
                        <p className="text-base font-black text-slate-900 dark:text-white leading-tight">{ksh(r.total)}</p>
                        <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          r.status === 'cancelled' || r.is_overdue ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                          r.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                          {done && <CheckCircle2 className="w-3 h-3" />}
                          {upcoming && <Clock className="w-3 h-3" />}
                          {r.status === 'active' && <KeyRound className="w-3 h-3" />}
                          {r.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                          {statusLabel(r)}
                        </span>
                     </div>
                     <div className={`p-2 rounded-xl transition-transform duration-300 ${isOpen ? 'rotate-90 bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                     </div>
                  </div>
                </div>
              </button>

              {/* Accordion Detail View */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 p-5 sm:p-6 space-y-6">
                      
                      {/* Grid Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          ["Booking ID", r.reference],
                          ["Pickup", dateTime(r.pickup_at)],
                          ["Return", dateTime(r.return_at)],
                          ["Daily Rate", ksh(r.daily_rate)],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k}</p>
                            <p className="font-black text-slate-900 dark:text-white text-sm truncate">{v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions & Ratings */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                        {r.can_rate ? (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rate Your Trip</p>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => rate(r, star)}
                                  aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                                  aria-pressed={star === userRating}
                                  className="focus:outline-none hover:scale-110 transition-transform"
                                >
                                  <Star className={`w-6 h-6 transition-colors ${star <= userRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700 hover:text-amber-200"}`} />
                                </button>
                              ))}
                            </div>
                            {userRating > 0 && (
                              <div className="mt-3 w-full sm:w-96">
                                <label htmlFor={`review-${r.id}`} className="sr-only">Written review</label>
                                <textarea
                                  id={`review-${r.id}`}
                                  rows={2}
                                  value={drafts[r.id] ?? r.review ?? ""}
                                  onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                                  placeholder="Tell the dealer how it went (optional)"
                                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                                />
                                <div className="flex items-center gap-3 mt-1.5">
                                  <Button size="xs" variant="secondary" onClick={() => rate(r, userRating, drafts[r.id] ?? r.review ?? "")}>Save review</Button>
                                  {savedReview === r.id && <span className="text-xs font-bold text-emerald-600">Saved</span>}
                                </div>
                                {r.review_reply && (
                                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{r.dealer?.name} replied:</span> {r.review_reply}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                           <div className="text-xs text-slate-500 italic flex items-center gap-2">
                             <MapPin className="w-4 h-4" /> Pickup at {r.pickup_location}
                             {r.status !== "cancelled" && " · rating opens after the trip"}
                           </div>
                        )}
                        
                        <div className="flex w-full sm:w-auto gap-3">
                          {r.allowed_transitions.includes("cancelled") && (
                            <Button variant="danger" onClick={() => cancel(r)} className="flex-1 sm:flex-none text-xs px-4 flex items-center justify-center gap-2">
                              <XCircle className="w-4 h-4" /> Cancel booking
                            </Button>
                          )}
                          <Button onClick={() => navigate("/customer-browse")} className="flex-1 sm:flex-none text-xs px-4 flex items-center justify-center gap-2 shadow-blue-500/20">
                            <RefreshCw className="w-4 h-4" /> Book Again
                          </Button>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {!loading && !error && filteredRentals.length === 0 && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">No trips found</h3>
              <p className="text-sm text-slate-500">{rentals.length ? "We couldn't find any rentals matching this filter." : "You haven't booked a car yet."}</p>
           </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}