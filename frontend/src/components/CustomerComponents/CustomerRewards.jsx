import React from "react";
import { motion } from "framer-motion";
import Button from "../Button";
import { 
  Award, Gift, Crown, Star, ChevronRight, 
  TrendingUp, TicketPercent, CheckCircle2, 
  Car,
  Users
} from "lucide-react";

const REWARDS = [
  { id: 1, title: "10% Off Next SUV Rental", cost: 500, type: "Discount", available: true },
  { id: 2, title: "Free Airport Transfer", cost: 1200, type: "Service", available: false },
  { id: 3, title: "Free Additional Driver", cost: 300, type: "Add-on", available: true },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CustomerRewards() {
  const currentPoints = 850;
  const nextTierPoints = 1500;

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      
      {/* ── Tier Hero Section ── */}
      <motion.div variants={itemVariants} className="p-8 sm:p-12 rounded-[3rem] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-2xl shadow-amber-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute -right-20 -top-20 opacity-20">
          <Crown className="w-96 h-96" />
        </div>
        
        <div className="relative z-10 w-full md:w-auto text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl text-xs font-black uppercase tracking-widest mb-6">
            <Award className="w-4 h-4" /> Gold Tier Member
          </div>
          <h2 className="text-5xl font-black mb-2">{currentPoints} <span className="text-2xl font-bold text-amber-200">PTS</span></h2>
          <p className="text-amber-100 font-medium">Earn points on every rental to unlock exclusive perks.</p>
        </div>

        <div className="relative z-10 w-full max-w-md bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
           <div className="flex justify-between items-end mb-3">
             <span className="text-xs font-bold text-amber-200 uppercase tracking-widest">Progress to Platinum</span>
             <span className="text-sm font-black">{currentPoints} / {nextTierPoints}</span>
           </div>
           <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden mb-4">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(currentPoints / nextTierPoints) * 100}%` }} className="h-full bg-white rounded-full" />
           </div>
           <p className="text-xs text-amber-100 font-medium text-center">Rent 2 more times this year to upgrade.</p>
        </div>
      </motion.div>

      {/* ── Ways to Earn ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
           <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4"><Car className="w-8 h-8" /></div>
           <h4 className="text-base font-black text-slate-900 dark:text-white">Rent Vehicles</h4>
           <p className="text-xs text-slate-500 mt-2">Earn 10 points for every KSh 1,000 spent.</p>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
           <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4"><Star className="w-8 h-8" /></div>
           <h4 className="text-base font-black text-slate-900 dark:text-white">Leave a Review</h4>
           <p className="text-xs text-slate-500 mt-2">Earn 50 points for reviewing your completed trips.</p>
        </div>
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
           <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-500 flex items-center justify-center mb-4"><Users className="w-8 h-8" /></div>
           <h4 className="text-base font-black text-slate-900 dark:text-white">Refer a Friend</h4>
           <p className="text-xs text-slate-500 mt-2">Earn 500 points when they complete their first rental.</p>
        </div>
      </motion.div>

      {/* ── Redeem Rewards ── */}
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Available Rewards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {REWARDS.map((reward) => (
            <div key={reward.id} className={`p-6 rounded-[2rem] border transition-all ${reward.available ? 'bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 hover:border-blue-500/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-70'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${reward.available ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                  <TicketPercent className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {reward.cost} PTS
                </span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2">{reward.title}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{reward.type}</p>
              
              <Button fullWidth variant={reward.available ? 'primary' : 'secondary'} className={!reward.available ? 'opacity-50 cursor-not-allowed' : ''}>
                {reward.available ? 'Redeem Now' : 'Not Enough Points'}
              </Button>
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}