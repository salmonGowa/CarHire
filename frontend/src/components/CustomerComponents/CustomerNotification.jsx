import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import { 
  Bell, CheckCircle2, CalendarDays, CreditCard, 
  Megaphone, Smartphone, Check
} from "lucide-react";

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function NotificationsSection() {
  // State for all notification toggles
  const [prefs, setPrefs] = useState({
    bookingConfirm: true,
    bookingReminder: true,
    paymentReceipt: true,
    promos: false,
    newsletter: false,
    smsAlerts: true,
    pushAlerts: true,
    reviewReminder: true,
    newOffers: false,
  });

  const [showToast, setShowToast] = useState(false);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Structured groups with metadata for UI rendering
  const GROUPS = [
    {
      title: "Booking & Rentals",
      icon: CalendarDays,
      colorClass: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
      items: [
        { key: "bookingConfirm", label: "Booking Confirmations", desc: "Email alerts when a rental is confirmed or modified." },
        { key: "bookingReminder", label: "Rental Reminders", desc: "24h & 1h reminders before your pickup time." },
        { key: "reviewReminder", label: "Review Requests", desc: "Prompt to rate the vehicle after completing a trip." },
      ],
    },
    {
      title: "Billing & Payments",
      icon: CreditCard,
      colorClass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      items: [
        { key: "paymentReceipt", label: "Payment Receipts", desc: "Instantly receive invoices and ETR receipts for transactions." },
      ],
    },
    {
      title: "Marketing & Offers",
      icon: Megaphone,
      colorClass: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
      items: [
        { key: "promos", label: "Promotions & Discounts", desc: "Exclusive deals, holiday specials, and loyalty rewards." },
        { key: "newsletter", label: "Fleet Newsletter", desc: "Monthly updates, driving tips, and dealership news." },
        { key: "newOffers", label: "New Vehicle Arrivals", desc: "Be the first to know when new cars join our fleet." },
      ],
    },
    {
      title: "Delivery Channels",
      icon: Smartphone,
      colorClass: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
      items: [
        { key: "smsAlerts", label: "SMS Text Alerts", desc: "Urgent updates and OTPs delivered directly via text." },
        { key: "pushAlerts", label: "Push Notifications", desc: "Real-time pop-up alerts on your mobile device." },
      ],
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10 relative">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notification Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Control how and when you receive updates from DriveFleet Pro.</p>
        </div>
      </motion.div>

      {/* ── Settings Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {GROUPS.map((group) => (
          <motion.div 
            variants={itemVariants} 
            key={group.title} 
            className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm h-fit"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-900/20">
              <div className={`p-2.5 rounded-xl ${group.colorClass}`}>
                <group.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{group.title}</h3>
            </div>
            
            <div className="p-3">
              {group.items.map((item) => {
                const isChecked = prefs[item.key];
                return (
                  <div 
                    key={item.key} 
                    onClick={() => toggle(item.key)}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors cursor-pointer group/row"
                  >
                    <div className="pr-6">
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{item.label}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
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
        ))}
      </div>

      {/* ── Save Action ── */}
      <motion.div variants={itemVariants} className="flex justify-end pt-4">
        <Button onClick={handleSave} className="px-8 py-3.5 shadow-blue-500/20 flex items-center gap-2">
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
            Preferences updated successfully
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}