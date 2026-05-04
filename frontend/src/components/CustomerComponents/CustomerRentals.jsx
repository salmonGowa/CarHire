import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import { 
  Car, Calendar, DollarSign, Star, ChevronRight, 
  Download, RefreshCw, CheckCircle2, Clock, XCircle, MapPin
} from "lucide-react";

// --- Mock Data ---
const RENTAL_HISTORY = [
  { id: "BKG-4412", car: "Toyota Prado", dealer: "Swift Car Hire", from: "Oct 24, 2023", to: "Oct 28, 2023", days: 4, total: 48000, status: "Upcoming", rating: 0 },
  { id: "BKG-4411", car: "Nissan X-Trail", dealer: "Premier Auto", from: "Sep 15, 2023", to: "Sep 17, 2023", days: 2, total: 12400, status: "Completed", rating: 4 },
  { id: "BKG-4410", car: "Toyota Camry", dealer: "City Movers", from: "Aug 28, 2023", to: "Aug 30, 2023", days: 2, total: 9000, status: "Completed", rating: 5 },
  { id: "BKG-4409", car: "Honda Fit", dealer: "Budget Wheels", from: "Jul 10, 2023", to: "Jul 15, 2023", days: 5, total: 15500, status: "Cancelled", rating: 0 },
  { id: "BKG-4408", car: "Mercedes C-Class", dealer: "Luxe Drive", from: "Jun 20, 2023", to: "Jun 22, 2023", days: 2, total: 37000, status: "Completed", rating: 5 },
];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CustomerRentals() {
  const [filter, setFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [ratingMap, setRatingMap] = useState({});

  // Fix: Apply the actual filter logic to the array
  const filteredRentals = RENTAL_HISTORY.filter(r => 
    filter === "All" || r.status.toLowerCase() === filter.toLowerCase()
  );

  const completedTrips = RENTAL_HISTORY.filter(r => r.status === "Completed");

  // Calculate stats based on completed trips to be accurate
  const stats = {
    total: completedTrips.length,
    spend: completedTrips.reduce((s, r) => s + r.total, 0),
    days: completedTrips.reduce((s, r) => s + r.days, 0),
    avgRating: (completedTrips.reduce((s, r) => s + r.rating, 0) / (completedTrips.length || 1)).toFixed(1),
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
          { label: "Completed Trips", value: stats.total, icon: Car, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Total Spent", value: `KSh ${stats.spend.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: "Days Driven", value: stats.days, icon: Calendar, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
          { label: "Avg Rating", value: `${stats.avgRating}`, icon: Star, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
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
        {["All", "Upcoming", "Completed", "Cancelled"].map((f) => (
          <button
            key={f}
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

      {/* ── Rental List ── */}
      <motion.div variants={itemVariants} className="space-y-4">
        {filteredRentals.map((r) => {
          const isOpen = expandedId === r.id;
          const userRating = ratingMap[r.id] ?? r.rating;

          return (
            <motion.div layout key={r.id} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] rounded-[2rem] overflow-hidden shadow-sm hover:border-blue-500/50 transition-colors">
              
              {/* Visible Row */}
              <button onClick={() => setExpandedId(isOpen ? null : r.id)} className="w-full flex items-center gap-4 p-5 sm:p-6 text-left focus:outline-none">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-100 dark:border-slate-700/50">
                  <Car className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <div className="min-w-0">
                    <p className="text-base font-black text-slate-900 dark:text-white truncate leading-tight">{r.car}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> {r.dealer}
                    </p>
                  </div>
                  
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{r.from}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{r.days} Days Total</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                     <div className="text-left sm:text-right">
                        <p className="text-base font-black text-slate-900 dark:text-white leading-tight">KSh {r.total.toLocaleString()}</p>
                        <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          r.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          r.status === 'Upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          {r.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                          {r.status === 'Upcoming' && <Clock className="w-3 h-3" />}
                          {r.status === 'Cancelled' && <XCircle className="w-3 h-3" />}
                          {r.status}
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
                          ["Booking ID", r.id],
                          ["Pickup Date", r.from],
                          ["Return Date", r.to],
                          ["Daily Rate", `KSh ${(r.total / r.days).toLocaleString()}`],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k}</p>
                            <p className="font-black text-slate-900 dark:text-white text-sm truncate">{v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions & Ratings */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                        {r.status === "Completed" ? (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rate Your Trip</p>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setRatingMap((m) => ({ ...m, [r.id]: star }))}
                                  className="focus:outline-none hover:scale-110 transition-transform"
                                >
                                  <Star className={`w-6 h-6 transition-colors ${star <= userRating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700 hover:text-amber-200"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                           <div className="text-xs text-slate-500 italic flex items-center gap-2">
                             <Clock className="w-4 h-4" /> Rating becomes available after trip completion.
                           </div>
                        )}
                        
                        <div className="flex w-full sm:w-auto gap-3">
                          {r.status !== "Cancelled" && (
                            <Button variant="secondary" className="flex-1 sm:flex-none text-xs px-4 flex items-center justify-center gap-2">
                              <Download className="w-4 h-4" /> Invoice
                            </Button>
                          )}
                          <Button className="flex-1 sm:flex-none text-xs px-4 flex items-center justify-center gap-2 shadow-blue-500/20">
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
        {filteredRentals.length === 0 && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">No trips found</h3>
              <p className="text-sm text-slate-500">We couldn't find any rentals matching this filter.</p>
           </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}