import React, { useState } from "react";
import { motion } from "framer-motion";
import Button from "../Button";
import { 
  Plug, Smartphone, CreditCard, MapPin, MessageSquare, 
  Settings2, CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react";

// --- Mock Integrations ---
const INTEGRATIONS = [
  { id: 1, name: "M-PESA Daraja API", category: "Payments", status: "Connected", icon: Smartphone, desc: "C2B Paybill and B2C Remittances.", latency: "124ms" },
  { id: 2, name: "Stripe", category: "Payments", status: "Connected", icon: CreditCard, desc: "Global credit card processing.", latency: "89ms" },
  { id: 3, name: "Twilio SMS", category: "Communications", status: "Connected", icon: MessageSquare, desc: "OTP and notification delivery.", latency: "45ms" },
  { id: 4, name: "TrackMe GPS", category: "Telemetry", status: "Degraded", icon: MapPin, desc: "Live vehicle location tracking.", latency: "1200ms" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminIntegrations() {
  const [toggles, setToggles] = useState({ 1: true, 2: true, 3: true, 4: true });

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Integrations</h2>
          <p className="text-sm text-slate-500 mt-1">Manage 3rd-party APIs, webhooks, and external services.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEGRATIONS.map((intg) => (
          <div key={intg.id} className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm flex flex-col gap-4 group hover:border-blue-500/50 transition-colors">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3.5 rounded-2xl ${intg.status === 'Connected' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                  <intg.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{intg.name}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{intg.category}</span>
                </div>
              </div>
              {/* Custom Toggle Switch */}
              <div onClick={() => setToggles({...toggles, [intg.id]: !toggles[intg.id]})} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ${toggles[intg.id] ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <motion.span animate={{ x: toggles[intg.id] ? 22 : 2 }} className="inline-block h-5 w-5 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{intg.desc}</p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-2">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                <span className={`flex items-center gap-1 ${intg.status === 'Connected' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {intg.status === 'Connected' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {intg.status}
                </span>
                <span className="text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">Latency: {intg.latency}</span>
              </div>
              <button className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors">
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}