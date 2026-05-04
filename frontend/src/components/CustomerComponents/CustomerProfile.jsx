import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../AuthContext";
import {
  User,
  Car,
  CreditCard,
  Lock,
  Bell,
  Shield,
  Mail,
  MapPin,
  Award,
  CheckCircle2,
  ChevronDown,
  Camera,
  Check,
} from "lucide-react";

import PersonalSection from "./PersonalSection";
import RentalsSection from "./CustomerRentals";
import PaymentsSection from "./CustomerPayment";
import SecuritySection from "./CustomerSecuritySection";
import NotificationsSection from "./CustomerNotification";
import PreferencesSection from "./CustomerPreference";
import ICONS from "../SvgIcons";

// --- Configuration ---
const SECTIONS = [
  { id: "personal", label: "Personal Info", Icon: User, color: "blue" },
  { id: "rentals", label: "Rental History", Icon: Car, color: "violet" },
  {
    id: "payments",
    label: "Payment Methods",
    Icon: CreditCard,
    color: "emerald",
  },
  { id: "security", label: "Security", Icon: Lock, color: "amber" },
  { id: "notifications", label: "Notifications", Icon: Bell, color: "rose" },
  { id: "preferences", label: "Preferences", Icon: Shield, color: "slate" },
];

const sectionAccent = {
  blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  violet:
    "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20",
  emerald:
    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  amber:
    "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  slate:
    "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20",
};

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function CustomerProfile() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("personal");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeMeta = SECTIONS.find((s) => s.id === activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case "personal":
        return <PersonalSection user={user} />;
      case "rentals":
        return <RentalsSection />;
      case "payments":
        return <PaymentsSection />;
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationsSection />;
      case "preferences":
        return <PreferencesSection />;
      default:
        return <PersonalSection user={user} />;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-12"
    >
      {/* ── Profile Hero Banner ── */}
      <motion.div
        variants={itemVariants}
        className="relative rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#0B1120]"
      >
        {/* Top Gradient Background */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Profile Info Area */}
        <div className="px-6 sm:px-10 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 sm:-mt-16">
            {/* Avatar with Upload Action */}
            <div className="relative flex-shrink-0 group cursor-pointer">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-slate-900 border-4 border-white dark:border-[#0B1120] flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-xl overflow-hidden relative">
                {/* Fallback Initial */}
                <span className="relative z-10 group-hover:opacity-0 transition-opacity duration-300">
                  {(user?.name?.[0] || "J").toUpperCase()}
                </span>

                {/* Hover Camera Icon */}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              {/* Verified Badge */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-[3px] border-white dark:border-[#0B1120] flex items-center justify-center shadow-md">
                <Check className="text-white w-4 h-4 stroke-[3]" />
              </div>
            </div>

            {/* Name & Badges */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* User Info */}
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight"
                  >
                    {user?.name || "James Mwangi"}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm font-bold text-slate-500 dark:text-slate-400"
                  >
                    <span className="flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
                      <Mail className="w-4 h-4 text-slate-400" />{" "}
                      {user?.email || "james@drivefleet.ke"}
                    </span>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-700">
                      •
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" /> Nairobi,
                      Kenya
                    </span>
                  </motion.div>
                </div>

                {/* Premium Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <div className="relative group cursor-default">
                    {/* Subtle background glow for premium feel */}
                    <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-md group-hover:bg-amber-500/30 transition-all duration-300" />
                    <span className="relative inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-4 py-2 rounded-xl shadow-sm">
                      <Award className="w-4 h-4" /> Gold Member
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Statistics Bar with Animated Stagger */}
              <motion.div
                variants={{
                  show: {
                    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
                  },
                }}
                initial="hidden"
                animate="show"
                className="flex items-center gap-6 sm:gap-10 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto custom-scrollbar pb-2"
              >
                {[
                  {
                    label: "Total Rentals",
                    value: "23",
                    icon: ICONS.Car,
                    color: "text-blue-500",
                  },
                  {
                    label: "Lifetime Spent",
                    value: "KSh 145K",
                    icon: ICONS.CreditCard,
                    color: "text-emerald-500",
                  },
                  {
                    label: "Driver Rating",
                    value: "4.8 / 5.0",
                    icon: ICONS.Star,
                    color: "text-amber-500",
                  },
                  {
                    label: "Member Since",
                    value: "Jan 2023",
                    icon: ICONS.CalendarDays,
                    color: "text-violet-500",
                  },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="flex-shrink-0 flex items-start gap-3 group"
                  >
                    <div className="mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                        {s.value}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">
                        {s.label}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Mobile Navigation Dropdown ── */}
      <motion.div variants={itemVariants} className="lg:hidden relative z-20">
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white shadow-sm"
        >
          <div className="flex items-center gap-3">
            {activeMeta && (
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border ${sectionAccent[activeMeta.color]}`}
              >
                <activeMeta.Icon className="w-4 h-4" />
              </div>
            )}
            {activeMeta?.label || "Select section"}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${mobileNavOpen ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSection(s.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-bold border-b border-slate-100 dark:border-slate-800/60 last:border-0 transition-colors ${activeSection === s.id ? "bg-slate-50 dark:bg-slate-900/50 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 ${activeSection === s.id ? sectionAccent[s.color] : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400"}`}
                  >
                    <s.Icon className="w-4 h-4" />
                  </div>
                  {s.label}
                  {activeSection === s.id && (
                    <CheckCircle2 className="w-5 h-5 ml-auto text-blue-500" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Desktop Layout: Sidebar & Content ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar Navigation */}
        <motion.div
          variants={itemVariants}
          className="hidden lg:flex flex-col gap-2 w-64 flex-shrink-0 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-4 sticky top-24 shadow-sm"
        >
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 mb-2 mt-2">
            Settings Menu
          </h3>
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all group overflow-hidden ${isActive ? "text-blue-600 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                {/* Active Background Pill */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-600 rounded-2xl"
                  />
                )}

                <div
                  className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? "bg-blue-600 dark:bg-white/20 text-white" : `bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 group-hover:border-slate-300 dark:group-hover:border-slate-600`}`}
                >
                  <s.Icon className="w-4 h-4" />
                </div>
                <span className="relative z-10 truncate">{s.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Dynamic Content Area */}
        <motion.div variants={itemVariants} className="flex-1 min-w-0 w-full">
          <div className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-10 shadow-sm min-h-[400px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.2 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
