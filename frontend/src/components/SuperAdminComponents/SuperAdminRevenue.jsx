import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  DollarSign, TrendingUp, BarChart3, Download, 
  Building2, ArrowUpRight, Calendar, ArrowDownRight
} from "lucide-react";

// --- Mock Data ---
const DEALER_REVENUE = [
  { id: "DLR-01", name: "Swift Car Hire", gross: 1250000, commission: 125000, growth: "+12.5%", status: "up" },
  { id: "DLR-02", name: "Luxe Drive", gross: 980000, commission: 98000, growth: "+8.2%", status: "up" },
  { id: "DLR-03", name: "Premier Auto", gross: 650000, commission: 65000, growth: "-2.4%", status: "down" },
  { id: "DLR-04", name: "City Movers", gross: 420000, commission: 42000, growth: "+1.1%", status: "up" },
];

// Mock Chart Data
const CHART_DATA = [45, 52, 38, 65, 72, 68, 85, 95, 82, 105, 110, 125];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminRevenue() {
  const maxChartVal = Math.max(...CHART_DATA);

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Global Revenue</h2>
          <p className="text-sm text-slate-500 mt-1">Platform-wide financial performance and commission tracking.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2 border-slate-200 dark:border-slate-800"><Calendar className="w-4 h-4" /> YTD 2023</Button>
          <Button className="gap-2 shadow-blue-500/20"><Download className="w-4 h-4" /> Export Report</Button>
        </div>
      </motion.div>

      {/* ── Top Level KPIs ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Volume */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-between relative overflow-hidden">
          <BarChart3 className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 pointer-events-none" />
          <div className="relative z-10">
             <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Platform Gross Volume</p>
             <h3 className="text-4xl font-black mb-2">KSh 32.5M</h3>
             <span className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg text-xs font-bold">
               <ArrowUpRight className="w-3 h-3" /> 18.2% vs Last Year
             </span>
          </div>
        </div>

        {/* Platform Commission */}
        <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-between">
           <div>
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Net Revenue</span>
             </div>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">KSh 3.25M</h3>
             <p className="text-sm font-bold text-slate-500">Total 10% Commission</p>
           </div>
        </div>

        {/* Dealer Performance */}
        <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-between">
           <div>
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-violet-50 dark:bg-violet-500/10 text-violet-600 rounded-xl"><Building2 className="w-5 h-5" /></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Dealers</span>
             </div>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">14</h3>
             <p className="text-sm font-bold text-slate-500 flex items-center gap-1">
               <span className="text-emerald-500 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> +2</span> this month
             </p>
           </div>
        </div>
      </motion.div>

      {/* ── Visual Analytics (Revenue Trend) ── */}
      <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
         <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Revenue Trend (YTD)</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Volume in Millions (KSh)</span>
         </div>
         <div className="flex items-end justify-between h-48 gap-2 sm:gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-2">
            {CHART_DATA.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black px-3 py-1 rounded-xl shadow-xl pointer-events-none z-10 whitespace-nowrap">
                  KSh {d/10}M
                </div>
                <motion.div 
                  initial={{ height: 0 }} animate={{ height: `${(d / maxChartVal) * 100}%` }} 
                  className="w-full max-w-[40px] bg-blue-50 dark:bg-blue-500/10 border-t-4 border-blue-500 rounded-t-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-500/30 transition-all duration-500" 
                />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}
                </span>
              </div>
            ))}
         </div>
      </motion.div>

      {/* ── Dealership Breakdown Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Revenue by Dealership</h3>
        </div>
        
        <Table heads={["Dealership", "Gross Processed", "Platform Commission (10%)", "MoM Growth", "Action"]}>
          {DEALER_REVENUE.map((dealer) => (
            <Tr key={dealer.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><Building2 className="w-5 h-5" /></div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{dealer.name}</span>
                    <span className="text-[10px] font-mono font-black text-slate-400 tracking-widest">{dealer.id}</span>
                  </div>
                </div>
              </Td>
              <Td className="font-bold text-slate-700 dark:text-slate-300">KSh {dealer.gross.toLocaleString()}</Td>
              <Td className="font-black text-emerald-600 dark:text-emerald-400">KSh {dealer.commission.toLocaleString()}</Td>
              <Td>
                 <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest border ${
                   dealer.status === 'up' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20'
                 }`}>
                   {dealer.status === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                   {dealer.growth}
                 </span>
              </Td>
              <Td className="text-right">
                <Button size="sm" variant="secondary" className="text-[10px] uppercase tracking-widest px-3">View Details</Button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}