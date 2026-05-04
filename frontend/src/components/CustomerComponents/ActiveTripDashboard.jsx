import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, X, MapPin, Car, Phone, CircleParking, 
  Map as MapIcon, Share2, Calendar, Key, Compass, 
  Star, Gem, Gift, Flag, Route, Clock, Bus, Footprints 
} from "lucide-react";

export default function ActiveTripDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock coordinates for Nairobi CBD Branch (Kimathi Street)
  const DEALER_COORDS = { lat: -1.2843, lng: 36.8248 };

  // Helper to open Google Maps Directions
  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${DEALER_COORDS.lat},${DEALER_COORDS.lng}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full space-y-6">
      
      {/* ─── TOP ROW: ACTIVE TRIP & LOYALTY STATS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Trip Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active Booking
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              Toyota Land Cruiser Prado
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-mono">BKG-7721A</span> &nbsp;•&nbsp; <span className="font-mono text-blue-600 dark:text-blue-400">KDK 123X</span> &nbsp;•&nbsp; Picking up soon
            </p>

            {/* Countdown Display */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time until pickup</p>
                <p className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">02:34:11</p>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Return date</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">Oct 28, 10:00 AM</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex gap-3">
                <Calendar className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pick-up</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">Today, 10:00 AM</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="text-slate-400 dark:text-slate-500 flex-shrink-0" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">Nairobi CBD Branch</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 relative z-10">
            <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold transition-colors shadow-lg shadow-slate-200 dark:shadow-none">
              <Key size={16} /> View Digital Key
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 text-sm font-bold transition-colors"
            >
              <Compass size={16} /> Get Directions
            </button>
          </div>
        </div>

        {/* Loyalty Card */}
        <div className="p-6 rounded-[2rem] border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">DriveFleet Rewards</h3>
              <Star className="text-amber-500 fill-current" size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-amber-100 mb-1">Gold Member</p>
            <p className="text-xs font-medium text-amber-700/60 dark:text-amber-400/60 mb-4">2,450 / 3,000 pts to Platinum</p>
            <div className="w-full h-2.5 bg-amber-200/50 dark:bg-amber-900/50 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-amber-500 rounded-full w-[81%]" />
            </div>
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 text-right flex items-center justify-end gap-1 mb-6">
              550 pts to Platinum <Gem size={10} />
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/50 dark:bg-black/20 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-3 text-center">
                <p className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">14</p>
                <p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-500/70 uppercase mt-0.5">Trips</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-3 text-center">
                <p className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">3</p>
                <p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-500/70 uppercase mt-0.5">Saved Cars</p>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-amber-200/50 dark:border-amber-800/50 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-amber-200 relative z-10">
            <Gift className="text-amber-500" size={16} /> 10% off your next SUV rental
          </div>
        </div>
      </div>

      {/* ─── DIRECTIONS MODAL ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#0B1120] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-widest">
                      <Building2 size={10} /> Branch
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">
                      Open Now
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">DriveFleet — Nairobi CBD Branch</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kimathi Street, Nairobi Central Business District</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="flex items-start gap-3">
                  <Clock className="text-emerald-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Open Now — Closes 8:00 PM today</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mon–Fri 7:00 AM – 8:00 PM &nbsp;·&nbsp; Sat–Sun 8:00 AM – 6:00 PM</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">About This Branch</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Our flagship CBD branch is on <strong className="text-slate-900 dark:text-white">Kimathi Street</strong>, directly opposite Nairobi Serena Hotel. It's busiest location with over <strong className="text-slate-900 dark:text-white">30 vehicles</strong> available.
                  </p>
                </div>

                {/* Simulated Map UI */}
                <div className="relative h-48 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden group">
                  <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                  <div className="absolute top-[40%] left-0 right-0 h-1.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="absolute left-[30%] top-0 bottom-0 w-1.5 bg-slate-300 dark:bg-slate-700" />
                  <div className="absolute top-[30%] left-[68%] w-5 h-5 rounded-full bg-rose-500 border-2 border-white dark:border-[#0B1120] shadow-lg z-10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  
                  {/* FUNCTIONAL BUTTON ON MAP */}
                  <button 
                    onClick={handleOpenMaps}
                    className="absolute inset-0 w-full h-full bg-black/0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <span className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold shadow-lg flex items-center gap-2">
                      <MapIcon size={14} /> Open full map
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: MapPin, label: "Address", val: "Kimathi St, Nairobi CBD\nOpposite Serena Hotel" },
                    { icon: Car, label: "Your Vehicle", val: "Toyota Prado · KDK 123X\nBay 7 — Basement Level" },
                    { icon: Phone, label: "Branch Phone", val: "+254 20 555 0192" },
                    { icon: CircleParking, label: "Parking", val: "Free customer parking\nBasement level, Gate B" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                        <item.icon size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-line">{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer - FUNCTIONAL BUTTONS */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0B1120] flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <button 
                  onClick={handleOpenMaps}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  <MapIcon size={16} /> Open in Google Maps
                </button>
                <button className="sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Share2 size={16} /> Share Location
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}