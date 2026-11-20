import { useState } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Award, Bell, Car, CheckCircle2, Clock, CreditCard, Lock, Mail, MapPin, Shield, Star, User, XCircle } from "lucide-react";
import LoadState from "../LoadState";
import { useApi } from "@/lib/useApi";
import { ksh } from "@/lib/format";
import type { Stats } from "@/types/models";
import type { Profile, Rewards } from "@/types/account";

import PersonalSection from "./PersonalSection";
import RentalsSection from "./CustomerRentals";
import PaymentsSection from "./CustomerPayment";
import SecuritySection from "./CustomerSecuritySection";
import NotificationsSection from "./CustomerNotification";
import PreferencesSection from "./CustomerPreference";

const SECTIONS = [
  { id: "personal", label: "Personal & ID", Icon: User },
  { id: "rentals", label: "Rental History", Icon: Car },
  { id: "payments", label: "Payment Details", Icon: CreditCard },
  { id: "security", label: "Security", Icon: Lock },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "preferences", label: "Preferences", Icon: Shield },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

const KYC_BADGE = {
  verified: { label: "ID verified", Icon: CheckCircle2, style: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
  pending: { label: "ID check pending", Icon: Clock, style: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  rejected: { label: "ID check failed", Icon: XCircle, style: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
};

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function CustomerProfile() {
  const { data, error, reload, setData } = useApi<{ data: Profile }>("/api/profile");
  const { data: stats } = useApi<Stats>("/api/stats");
  const { data: rewards } = useApi<Rewards>("/api/rewards");
  const [active, setActive] = useState<SectionId>("personal");
  const profile = data?.data;

  if (!profile) return <LoadState loading={!error} error={error} onRetry={reload} />;
  const onSaved = (p: Profile) => setData({ data: p });
  const kyc = KYC_BADGE[profile.kyc.status];
  const trips = stats?.trips;

  const renderSection = () => {
    switch (active) {
      case "rentals": return <RentalsSection />;
      case "payments": return <PaymentsSection profile={profile} onSaved={onSaved} />;
      case "security": return <SecuritySection />;
      case "notifications": return <NotificationsSection profile={profile} onSaved={onSaved} />;
      case "preferences": return <PreferencesSection profile={profile} onSaved={onSaved} />;
      default: return <PersonalSection profile={profile} onSaved={onSaved} />;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6 pb-12">
      <motion.div variants={itemVariants} className="relative rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#0B1120]">
        <div className="h-28 sm:h-36 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        </div>
        <div className="px-6 sm:px-10 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="-mt-12 relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-slate-900 border-4 border-white dark:border-[#0B1120] flex items-center justify-center text-white text-4xl font-black shadow-xl flex-shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pt-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">{profile.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {profile.email}</span>
                    {profile.county && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {profile.county}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setActive("personal")} className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest border px-3 py-1.5 rounded-xl ${kyc.style}`}>
                    <kyc.Icon className="w-4 h-4" /> {kyc.label}
                  </button>
                  {rewards && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-xl">
                      <Award className="w-4 h-4" /> {rewards.tier} member
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-8 sm:gap-10 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto pb-1">
                {[
                  { label: "Completed Trips", value: trips ? String(trips.completed) : "—", Icon: Car, color: "text-blue-500" },
                  { label: "Days on the Road", value: trips ? String(trips.days) : "—", Icon: Clock, color: "text-violet-500" },
                  { label: "Total Spent", value: trips ? ksh(trips.total_spent) : "—", Icon: CreditCard, color: "text-emerald-500" },
                  { label: "Avg Rating Given", value: trips?.average_rating ? `${trips.average_rating} / 5` : "—", Icon: Star, color: "text-amber-500" },
                  { label: "Reward Points", value: rewards ? rewards.points.toLocaleString() : "—", Icon: Award, color: "text-rose-500" },
                ].map(({ label, value, Icon, color }) => (
                  <div key={label} className="flex-shrink-0 flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${color}`} />
                    <div>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        <motion.nav variants={itemVariants} aria-label="Profile sections" className="lg:w-64 flex-shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible p-2 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm lg:sticky lg:top-6">
            {SECTIONS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActive(id)} aria-current={active === id ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${active === id
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}>
                <Icon className="w-4 h-4" /> {label}
                {id === "personal" && profile.kyc.status !== "verified" && <span className="ml-auto w-2 h-2 rounded-full bg-amber-500" aria-label="needs attention" />}
              </button>
            ))}
          </div>
        </motion.nav>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
