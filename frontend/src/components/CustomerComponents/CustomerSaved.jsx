import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from "../Button";
import { 
  Heart, X, Settings2, Fuel, Users, 
  ChevronRight, Search, Trash2, CheckCircle2, Bell,
  Clock
} from "lucide-react";

// --- Mock Data with Images ---
const SAVED_VEHICLES = [
  {
    id: "v1",
    name: "Range Rover Sport",
    type: "Luxury SUV",
    price: 15000,
    rating: 4.9,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&q=80&w=600",
    specs: { transmission: "Auto", fuel: "Petrol", seats: 5 },
    available: true,
  },
  {
    id: "v2",
    name: "Volkswagen Tiguan",
    type: "Compact SUV",
    price: 8500,
    rating: 4.7,
    reviews: 85,
    image: "https://images.unsplash.com/photo-1559404225-b6d216f4eeb4?auto=format&fit=crop&q=80&w=600",
    specs: { transmission: "Auto", fuel: "Diesel", seats: 5 },
    available: false,
  },
  {
    id: "v3",
    name: "Toyota Land Cruiser V8",
    type: "Full-size SUV",
    price: 20000,
    rating: 4.9,
    reviews: 210,
    image: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&q=80&w=600",
    specs: { transmission: "Auto", fuel: "Petrol", seats: 7 },
    available: true,
  }
];

// --- Animation Variants ---
const containerVariants = { 
  hidden: { opacity: 0 }, 
  show: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const itemVariants = { 
  hidden: { opacity: 0, scale: 0.95, y: 20 }, 
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

export default function CustomerSaved() {
  const [saved, setSaved] = useState(SAVED_VEHICLES);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState(null);

  // --- Handlers ---
  const showToast = (message, icon = "check") => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const removeFavorite = (id, name) => {
    setSaved(saved.filter(item => item.id !== id));
    showToast(`Removed ${name} from your list`, "check");
  };

  const handleClearAll = () => {
    setSaved([]);
    setConfirmClear(false);
    showToast("Cleared all saved vehicles", "trash");
  };

  const handleNotify = (name) => {
    showToast(`You'll be notified when ${name} is back!`, "bell");
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10 relative">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Saved Vehicles
            <span className="text-sm font-black bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/20">
              {saved.length}
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Your favorite rides, shortlisted for your next journey.</p>
        </div>
        
        {saved.length > 0 && (
          <div className="flex items-center justify-end">
            <AnimatePresence mode="wait">
              {confirmClear ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs font-bold text-slate-500 mr-2">Are you sure?</span>
                  <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleClearAll} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 transition-colors">
                    Yes, Clear All
                  </button>
                </motion.div>
              ) : (
                <motion.button 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onClick={() => setConfirmClear(true)}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" /> Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Grid or Empty State ── */}
      {saved.length > 0 ? (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {saved.map((car) => (
              <motion.div 
                key={car.id} 
                variants={itemVariants}
                initial="hidden" animate="show" exit="exit" layout
                className="group bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden hover:shadow-2xl dark:hover:shadow-blue-500/5 transition-all duration-300 flex flex-col hover:border-blue-500/50"
              >
                {/* Image Section */}
                <div className="h-56 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                  <img 
                    src={car.image} 
                    alt={car.name} 
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!car.available ? 'grayscale opacity-70' : ''}`}
                  />
                  
                  {/* Floating Action: Remove */}
                  <button 
                    onClick={() => removeFavorite(car.id, car.name)}
                    className="absolute top-4 right-4 p-2.5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
                    title="Remove from saved"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>

                  {/* Unavailable Overlay */}
                  {!car.available && (
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-700 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
                         <Clock className="w-4 h-4 text-white" />
                         <span className="text-white text-xs font-black uppercase tracking-widest">Currently Rented</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {car.name}
                      </h3>
                      <p className="text-xs text-blue-500 font-bold mt-1">{car.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Per Day</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1">
                        KSh {car.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl gap-1">
                      <Settings2 className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{car.specs.transmission}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl gap-1">
                      <Fuel className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{car.specs.fuel}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{car.specs.seats} Seats</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-auto flex items-center gap-3">
                    {car.available ? (
                      <Button fullWidth className="text-sm py-3 group-hover:bg-blue-500 transition-colors shadow-blue-500/20">
                        Book Now <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    ) : (
                      <Button fullWidth variant="secondary" onClick={() => handleNotify(car.name)} className="text-sm py-3 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                        <Bell className="w-4 h-4 mr-2" /> Notify Me
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* ── Empty State ── */
        <motion.div 
          variants={itemVariants}
          className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm relative overflow-hidden"
        >
          {/* Ambient background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-500/20 dark:to-rose-500/5 rounded-[2rem] rotate-12 flex items-center justify-center mb-6 shadow-inner border border-white/50 dark:border-rose-500/20">
            <Heart className="w-10 h-10 text-rose-500 -rotate-12 fill-rose-500/20" />
          </div>
          <h3 className="relative z-10 text-2xl font-black text-slate-900 dark:text-white mb-2">No saved vehicles yet</h3>
          <p className="relative z-10 text-slate-500 max-w-md mx-auto mb-8">
            Start browsing our premium fleet and tap the heart icon to shortlist the cars you'd love to drive for your next trip.
          </p>
          <Button className="relative z-10 flex items-center gap-2 px-8 py-3 shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
            <Search className="w-5 h-5" /> Browse Fleet
          </Button>
        </motion.div>
      )}

      {/* ── Dynamic Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }} 
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-50 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-slate-800 dark:border-slate-200"
          >
            {toast.icon === "check" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {toast.icon === "trash" && <Trash2 className="w-5 h-5 text-rose-500" />}
            {toast.icon === "bell" && <Bell className="w-5 h-5 text-blue-500" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}