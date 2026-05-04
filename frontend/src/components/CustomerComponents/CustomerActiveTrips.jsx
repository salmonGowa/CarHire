import React from "react";
import { motion } from "framer-motion";
import Button from "../Button";
import { 
  MapPin, Clock, Navigation, Battery, ShieldAlert, 
  Key, Phone, CalendarClock, ChevronRight, Car
} from "lucide-react";

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CustomerActiveTrip() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 pb-4">
      
      {/* ── Left Sidebar: Trip Details ── */}
      <motion.div variants={itemVariants} className="w-full lg:w-[400px] flex flex-col gap-6">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
           <div className="flex items-center justify-between mb-8 relative z-10">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Trip Active
              </span>
              <span className="text-xs font-mono font-bold text-blue-200">BKG-7721</span>
           </div>
           
           <div className="relative z-10 mb-8">
              <p className="text-sm font-bold text-blue-200 mb-1">Current Vehicle</p>
              <h2 className="text-3xl font-black leading-tight">Toyota Prado</h2>
              <p className="text-lg font-mono font-bold text-blue-100 mt-1">KDK 123X</p>
           </div>

           <div className="p-4 rounded-2xl bg-black/20 backdrop-blur-md flex items-center justify-between relative z-10 border border-white/10">
              <div>
                <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1">Time Remaining</p>
                <p className="text-xl font-black">1d 04h 22m</p>
              </div>
              <Clock className="w-8 h-8 text-blue-300 opacity-50" />
           </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-500 transition-colors shadow-sm group">
             <CalendarClock className="w-8 h-8 mb-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
             <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-blue-500">Extend Trip</span>
          </button>
          <button className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:text-rose-500 transition-colors shadow-sm group">
             <ShieldAlert className="w-8 h-8 mb-3 text-slate-400 group-hover:text-rose-500 transition-colors" />
             <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-rose-500">Report Issue</span>
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
           <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-3">Drop-off Details</h4>
           <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0"><MapPin className="w-5 h-5" /></div>
              <div>
                 <p className="text-sm font-bold text-slate-900 dark:text-white">Nairobi CBD Branch</p>
                 <p className="text-xs text-slate-500 mt-1">Waiyaki Way, Next to Safaricom House.</p>
              </div>
           </div>
           <Button variant="secondary" fullWidth className="text-xs uppercase tracking-widest mt-2">Get Directions</Button>
        </div>
      </motion.div>

      {/* ── Right Content: Live Map ── */}
      <motion.div variants={itemVariants} className="flex-1 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#060B18] relative overflow-hidden flex flex-col justify-between p-6">
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        
        {/* Top Floating Bar */}
        <div className="relative z-10 flex items-center justify-between">
           <div className="px-5 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Speed</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">42 km/h</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fuel/Battery</span>
                <span className="text-lg font-black text-emerald-500">85%</span>
              </div>
           </div>
           <button className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-2xl shadow-lg hover:bg-slate-50 transition-colors">
              <Phone className="w-5 h-5 text-blue-500" />
           </button>
        </div>

        {/* Map Center Graphic */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full scale-[3] animate-ping" />
            <div className="absolute inset-0 bg-blue-500/10 rounded-full scale-[5] animate-ping [animation-delay:0.5s]" />
            <div className="w-20 h-20 rounded-full bg-blue-600 border-[4px] border-white dark:border-slate-900 shadow-2xl flex items-center justify-center relative z-10">
              <Navigation className="w-8 h-8 text-white rotate-45" />
            </div>
          </div>
        </div>

        {/* Bottom Digital Key */}
        <div className="relative z-10 mt-auto flex justify-center">
           <button className="w-full max-w-sm py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
             <Key className="w-5 h-5" /> Digital Unlock / Lock
           </button>
        </div>
      </motion.div>

    </motion.div>
  );
}