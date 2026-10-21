import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { capitalize, ksh } from "@/lib/format";
import type { Paginated, Vehicle } from "@/types/models";
import LoadState from "../LoadState";
import BookVehicleModal from "./BookVehicleModal";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import { 
  Search, Users, Settings2, 
  Star, ChevronRight, Fuel, Heart, CheckCircle2
} from "lucide-react";

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CustomerBrowse() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [booking, setBooking] = useState<Vehicle | null>(null);

  const query = new URLSearchParams({ per_page: "100", ...(activeFilter !== "All" && { type: activeFilter }) });
  const { data, setData, loading, error, reload } = useApi<Paginated<Vehicle>>(`/api/catalog/vehicles?${query}`);
  const vehicles = (data?.data ?? []).filter((v) => v.model.toLowerCase().includes(search.trim().toLowerCase()));

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000); // Auto hide after 3s
  };

  // Optimistically flip the heart, then persist; roll back if the request fails.
  const toggleSave = async (vehicle: Vehicle) => {
    const saved = !vehicle.is_saved;
    const flip = (value: boolean) => setData((d) => d && { ...d, data: d.data.map((v) => (v.id === vehicle.id ? { ...v, is_saved: value } : v)) });
    flip(saved);
    try {
      await api(`/api/saved-vehicles/${vehicle.id}`, { method: saved ? "PUT" : "DELETE" });
      showToast(saved ? `Saved ${vehicle.model} to favorites!` : `Removed ${vehicle.model} from saved.`);
    } catch {
      flip(!saved);
      showToast("Couldn't update favorites. Please try again.");
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10 relative">
      
      {/* ── Header & Search ── */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 dark:bg-[#0B1120] p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white tracking-tight">Find Your Ride</h2>
          <p className="text-sm text-slate-400 mt-2">Premium vehicles ready for your next journey.</p>
        </div>
        <div className="relative z-10 w-full md:w-96 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search vehicles"
              placeholder="Search make or model..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 outline-none focus:bg-white/20 transition-all backdrop-blur-md"
            />
          </div>
        </div>
      </motion.div>

      {/* ── Category Filters ── */}
      <motion.div variants={itemVariants} className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
        {['All', 'SUV', 'Compact', 'Sedan', 'Luxury', 'Van', 'Pickup'].map(cat => (
          <button 
            key={cat} onClick={() => setActiveFilter(cat)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
              activeFilter === cat 
                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25" 
                : "bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-500/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* ── Vehicle Grid ── */}
      <LoadState loading={loading} error={error} onRetry={reload} empty={vehicles.length === 0 && "No vehicles match. Try another category or search."}>
      <motion.div variants={itemVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => {
          const isSaved = !!vehicle.is_saved;

          return (
            <div key={vehicle.id} className="group rounded-[2rem] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-blue-500/5 transition-all duration-300">
              
              {/* Image Section */}
              <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img src={vehicle.image_url ?? ""} alt={vehicle.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                {/* Rating Badge */}
                {vehicle.rating != null && (
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold shadow-lg border border-white/20 dark:border-slate-700">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {vehicle.rating}
                </div>
                )}

                {/* Interactive Save Button */}
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleSave(vehicle)}
                  aria-label={isSaved ? `Remove ${vehicle.model} from saved` : `Save ${vehicle.model}`}
                  aria-pressed={isSaved}
                  className="absolute top-4 right-4 p-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl flex items-center justify-center transition-all shadow-lg border border-white/20 dark:border-slate-700 group/btn hover:bg-white dark:hover:bg-slate-800"
                >
                  <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover/btn:text-rose-500'}`} />
                </motion.button>
              </div>
              
              {/* Details Section */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{vehicle.model}</h3>
                    <p className="text-sm font-bold text-blue-500 mt-1">{vehicle.type} · <span className="text-slate-500 dark:text-slate-400 font-semibold">{vehicle.dealer?.name}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Per Day</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{ksh(vehicle.daily_rate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl gap-1">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{vehicle.seats} Seats</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl gap-1">
                    <Settings2 className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{vehicle.transmission === "auto" ? "Auto" : "Manual"}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl gap-1">
                    <Fuel className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{capitalize(vehicle.fuel_type)}</span>
                  </div>
                </div>

                <Button fullWidth onClick={() => setBooking(vehicle)} className="group-hover:bg-blue-500 transition-colors shadow-blue-500/20">
                  Book Now <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

            </div>
          );
        })}
      </motion.div>
      </LoadState>

      <BookVehicleModal key={booking?.id ?? "none"} vehicle={booking} onClose={() => setBooking(null)} />

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-50 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}