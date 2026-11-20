import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Car, Gem, MapPin, Navigation, Phone } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useNow, formatDuration } from "@/lib/useNow";
import { mapsLink, tripPhase } from "@/lib/trip";
import { dateTime, ksh } from "@/lib/format";
import type { CurrentTrip, Rewards } from "@/types/account";

/** Dashboard summary: the current or next trip, and loyalty standing. */
export default function ActiveTripDashboard() {
  const { data: trip } = useApi<CurrentTrip>("/api/trips/current");
  const { data: rewards } = useApi<Rewards>("/api/rewards");
  const now = useNow(30_000);
  const t = trip?.data;
  const phase = t ? tripPhase(t.booking, now) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        {!trip ? <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/50" /> : !t || !phase ? (
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No trip booked</p>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Where to next?</h2>
              <p className="text-sm text-slate-500 mt-1">Your next pickup, countdown and dealer details will show here.</p>
            </div>
            <Link to="/customer-browse" className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold">Browse vehicles <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> {phase.label}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">{t.vehicle?.model}</h2>
            <p className="text-sm font-medium text-slate-500 mt-1"><span className="font-mono">{t.booking.reference}</span> · <span className="font-mono text-blue-600 dark:text-blue-400">{t.vehicle?.plate}</span> · {t.dealer?.name}</p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{phase.countdownLabel}</p>
                <p className={`text-3xl font-black font-mono tracking-tight ${phase.overdue ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>{formatDuration(Math.abs(phase.target - now))}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">{ksh(t.booking.total)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="flex gap-3"><Calendar className="text-slate-400 shrink-0" size={20} /><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pickup</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{dateTime(t.booking.pickup_at)}</p></div></div>
              <div className="flex gap-3"><Calendar className="text-slate-400 shrink-0" size={20} /><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Return</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{dateTime(t.booking.return_at)}</p></div></div>
              <div className="flex gap-3 sm:col-span-2"><MapPin className="text-slate-400 shrink-0" size={20} /><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{t.booking.pickup_location}</p></div></div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link to="/customer-active-trip" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold"><Car className="w-4 h-4" /> Trip details</Link>
              <a href={mapsLink(t.booking.pickup_location, t.dealer?.city, "Kenya")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200"><Navigation className="w-4 h-4" /> Directions</a>
              {t.dealer?.phone && <a href={`tel:${t.dealer.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200"><Phone className="w-4 h-4" /> Call dealer</a>}
            </div>
          </div>
        )}
      </div>

      <Link to="/customer-rewards" className="p-6 sm:p-8 rounded-[2rem] border border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 shadow-sm flex flex-col justify-between hover:border-amber-300">
        <div>
          <div className="flex items-center gap-2"><Gem className="w-4 h-4 text-amber-500" /><h3 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">DriveFleet Rewards</h3></div>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-4">{rewards ? rewards.points.toLocaleString() : "—"} <span className="text-base font-bold text-slate-500">pts</span></p>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-1">{rewards?.tier ?? "…"} member</p>
          {rewards && <p className="text-xs text-slate-500 mt-4">Earn 1 point per {ksh(rewards.rules.ksh_per_point)} paid on a trip and {rewards.rules.points_per_review} for each review.{rewards.unrated > 0 && ` ${rewards.unrated} trip${rewards.unrated === 1 ? "" : "s"} waiting for your rating.`}</p>}
        </div>
        {rewards?.next_tier && (
          <div className="mt-6">
            <div className="h-2 rounded-full bg-amber-100 dark:bg-amber-500/10 overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (rewards.lifetime_value / rewards.next_tier.threshold) * 100)}%` }} /></div>
            <p className="text-xs text-slate-500 mt-2">{ksh(rewards.next_tier.threshold - rewards.lifetime_value)} more to {rewards.next_tier.name}</p>
          </div>
        )}
      </Link>
    </div>
  );
}
