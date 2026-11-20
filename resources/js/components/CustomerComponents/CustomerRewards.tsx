import { type Variants, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Award, Car, Gift, Info, Star, TrendingUp } from "lucide-react";
import LoadState from "../LoadState";
import { useApi } from "@/lib/useApi";
import { ksh, longDate } from "@/lib/format";
import type { Rewards } from "@/types/account";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const TIER_STYLE: Record<string, string> = {
  Bronze: "from-orange-500 to-amber-700",
  Silver: "from-slate-400 to-slate-600",
  Gold: "from-amber-400 to-orange-500",
  Platinum: "from-violet-500 to-indigo-700",
};

export default function CustomerRewards() {
  const { data: r, loading, error, reload } = useApi<Rewards>("/api/rewards");
  if (!r) return <LoadState loading={loading} error={error} onRetry={reload} />;

  const progress = r.next_tier ? Math.min(100, Math.round((r.lifetime_value / r.next_tier.threshold) * 100)) : 100;

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Loyalty & Rewards</h2>
        <p className="text-sm text-slate-500 mt-1">Your tier grows with what you spend on DriveFleet. Points are earned on every paid trip and review.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-8 rounded-[2.5rem] bg-gradient-to-br ${TIER_STYLE[r.tier] ?? TIER_STYLE.Bronze} text-white shadow-xl relative overflow-hidden`}>
          <Award className="absolute -right-6 -bottom-6 w-44 h-44 text-white/10" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">{r.tier} member</p>
          <h3 className="text-5xl font-black mt-2">{r.points.toLocaleString()} <span className="text-2xl font-bold text-white/80">points</span></h3>
          <p className="text-sm text-white/80 mt-2">{ksh(r.lifetime_value)} spent across {r.completed_trips} completed trip{r.completed_trips === 1 ? "" : "s"}</p>
          <div className="mt-8 relative z-10">
            {r.next_tier ? (
              <>
                <div className="flex justify-between text-xs font-bold text-white/90 mb-2">
                  <span>{r.tier}</span><span>{ksh(r.next_tier.threshold - r.lifetime_value)} more to reach {r.next_tier.name}</span>
                </div>
                <div className="h-3 rounded-full bg-white/20 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className="h-full bg-white rounded-full" /></div>
              </>
            ) : <p className="text-sm font-bold">You're at our top tier. Thank you for riding with us.</p>}
          </div>
        </div>

        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Tiers</h3>
          {r.tiers.map((t) => (
            <div key={t.name} className={`flex items-center justify-between p-3 rounded-xl ${t.name === r.tier ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20" : "bg-slate-50 dark:bg-slate-900"}`}>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.name}{t.name === r.tier && " · you"}</span>
              <span className="text-xs text-slate-500">{t.threshold ? `from ${ksh(t.threshold)}` : "starting tier"}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm flex gap-4">
          <div className="p-3 h-fit rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600"><Car className="w-5 h-5" /></div>
          <div><h4 className="font-black text-slate-900 dark:text-white">Rent vehicles</h4><p className="text-sm text-slate-500 mt-1">1 point for every {ksh(r.rules.ksh_per_point)} you pay on a completed trip.</p></div>
        </div>
        <Link to="/customer-rentals" className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm flex gap-4 hover:border-amber-300">
          <div className="p-3 h-fit rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600"><Star className="w-5 h-5" /></div>
          <div>
            <h4 className="font-black text-slate-900 dark:text-white">Leave a review</h4>
            <p className="text-sm text-slate-500 mt-1">{r.rules.points_per_review} points for each trip you rate.{r.unrated > 0 && <strong className="text-amber-600"> You have {r.unrated} trip{r.unrated === 1 ? "" : "s"} to rate.</strong>}</p>
          </div>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800"><h3 className="font-black text-slate-900 dark:text-white">Points history</h3></div>
          {r.history.length === 0 ? <p className="p-10 text-center text-sm text-slate-400">Finish your first trip to start earning points.</p> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {r.history.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{h.label}</p><p className="text-xs text-slate-500">{longDate(h.at)}</p></div>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{h.points}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-6 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><Gift className="w-4 h-4 text-violet-500" /> Redeeming points</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Spending points on discounts isn't available yet. Your points are kept and will count once rewards launch.</p>
          <p className="flex items-start gap-2 text-xs text-slate-500"><Info className="w-4 h-4 shrink-0" /> Dealers' promo codes still work at checkout in the meantime.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
