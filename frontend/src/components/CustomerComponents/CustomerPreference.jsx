import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import { 
  Shield, CheckCircle2, Globe, DollarSign, Calendar, 
  Car, Lock, Check, Eye, Share2, Activity
} from "lucide-react";

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CustomerPreference() {
  const [currency, setCurrency] = useState("KES");
  const [language, setLanguage] = useState("English");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [carType, setCarType] = useState(["SUV", "Luxury"]);
  const [showToast, setShowToast] = useState(false);

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    shareData: false,
    onlineStatus: true
  });

  // --- Handlers ---
  const updatePrivacy = (key) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCarType = (t) => {
    setCarType(ct => ct.includes(t) ? ct.filter(x => x !== t) : [...ct, t]);
  };

  const save = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // --- Data ---
  const VEHICLE_TYPES = ["Sedan", "SUV", "Luxury", "Compact", "4×4", "Van", "Minibus"];
  
  const PRIVACY_SETTINGS = [
    { key: "showProfile", label: "Show profile to dealers", desc: "Dealers can view your rental history and rating.", icon: Eye },
    { key: "shareData", label: "Share usage data", desc: "Help improve the app by sharing anonymised data.", icon: Share2 },
    { key: "onlineStatus", label: "Show online status", desc: "Let others see when you were last active.", icon: Activity },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10 relative">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">App Preferences</h2>
          <p className="text-sm text-slate-500 mt-1">Personalise your DriveFleet Pro experience.</p>
        </div>
      </motion.div>

      {/* ── Display & Localization ── */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Localization</h3>
        </div>
        
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Currency", icon: DollarSign, val: currency, set: setCurrency, opts: ["KES", "USD", "EUR", "GBP"] },
            { label: "Language", icon: Globe, val: language, set: setLanguage, opts: ["English", "Swahili", "French"] },
            { label: "Date Format", icon: Calendar, val: dateFormat, set: setDateFormat, opts: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
          ].map(s => (
            <div key={s.label} className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <s.icon className="w-3 h-3" /> {s.label}
              </label>
              <select
                value={s.val}
                onChange={e => s.set(e.target.value)}
                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
              >
                {s.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Preferred Vehicle Types ── */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Preferred Vehicles</h3>
            <p className="text-xs text-slate-500 font-medium">We'll tailor your search recommendations based on these.</p>
          </div>
        </div>
        
        <div className="p-6 flex flex-wrap gap-3">
          {VEHICLE_TYPES.map(t => {
            const active = carType.includes(t);
            return (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={t}
                onClick={() => toggleCarType(t)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  active 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25" 
                    : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {t}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Privacy Settings ── */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Privacy Settings</h3>
        </div>
        
        <div className="p-3">
          {PRIVACY_SETTINGS.map((item) => {
            const isChecked = privacy[item.key];
            return (
              <div 
                key={item.key} 
                onClick={() => updatePrivacy(item.key)}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group/row"
              >
                <div className="flex items-start gap-4 pr-6">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{item.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                
                {/* Custom Animated Toggle Switch */}
                <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${isChecked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <motion.span 
                    animate={{ x: isChecked ? 22 : 2 }} 
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="inline-block h-5 w-5 rounded-full bg-white shadow-sm" 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Save Action ── */}
      <motion.div variants={itemVariants} className="flex justify-end pt-4">
        <Button onClick={save} className="px-8 py-3.5 shadow-blue-500/20 flex items-center gap-2">
          <Check className="w-5 h-5" /> Save Preferences
        </Button>
      </motion.div>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }} 
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-50 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-slate-800 dark:border-slate-200"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Preferences saved successfully
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}