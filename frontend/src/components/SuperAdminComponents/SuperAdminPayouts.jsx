import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  Wallet, Landmark, ArrowRightLeft, DollarSign, 
  Download, Filter, Search, CheckCircle2, Clock
} from "lucide-react";

// --- Mock Financial Data ---
const PAYOUTS = [
  { id: "PO-104", dealer: "Swift Car Hire", period: "Oct 15 - Oct 21", gross: 450000, commission: 45000, net: 405000, status: "Pending Remittance" },
  { id: "PO-103", dealer: "Luxe Drive", period: "Oct 15 - Oct 21", gross: 820000, commission: 82000, net: 738000, status: "Processing" },
  { id: "PO-102", dealer: "Premier Auto", period: "Oct 08 - Oct 14", gross: 310000, commission: 31000, net: 279000, status: "Cleared" },
  { id: "PO-101", dealer: "City Movers", period: "Oct 08 - Oct 14", gross: 125000, commission: 12500, net: 112500, status: "Cleared" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminPayouts() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dealer Payouts</h2>
          <p className="text-sm text-slate-500 mt-1">Manage platform commissions and remit funds to dealerships.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
          <Button className="gap-2 shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white border-none"><Landmark className="w-4 h-4" /> Run Payout Cycle</Button>
        </div>
      </motion.div>

      {/* ── Financial Split Matrix ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-[#060B14] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Gross Volume (MTD)</p>
          <h3 className="text-4xl font-black mb-4">KSh 4.2M</h3>
          <div className="text-xs font-bold text-slate-400 mt-auto">Processed across 12 active dealers</div>
        </div>

        <div className="p-6 rounded-[2rem] border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 flex flex-col justify-center">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4"><Wallet className="w-5 h-5" /></div>
          <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Platform Revenue (10% Cut)</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">KSh 420,000</h3>
        </div>

        <div className="p-6 rounded-[2rem] border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 flex flex-col justify-center">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4"><ArrowRightLeft className="w-5 h-5" /></div>
          <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Pending Remittances</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">KSh 1.1M</h3>
        </div>
      </motion.div>

      {/* ── Settlement Ledger ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
           <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Settlement Queue</h3>
           <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder="Search dealer..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
              </div>
              <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"><Filter className="w-4 h-4" /></button>
           </div>
        </div>
        
        <Table heads={["Payout Ref & Dealer", "Period", "Gross Collected", "Platform Cut (10%)", "Net Remittance", "Status", "Action"]}>
          {PAYOUTS.map((po) => (
            <Tr key={po.id}>
              <Td>
                <span className="font-mono text-[10px] font-black text-slate-400 block mb-0.5">{po.id}</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{po.dealer}</span>
              </Td>
              <Td className="text-xs font-medium text-slate-600 dark:text-slate-400">{po.period}</Td>
              <Td className="font-bold text-slate-700 dark:text-slate-300">KSh {po.gross.toLocaleString()}</Td>
              <Td className="font-bold text-blue-600 dark:text-blue-400">-KSh {po.commission.toLocaleString()}</Td>
              <Td className="font-black text-emerald-600 dark:text-emerald-400 text-base">KSh {po.net.toLocaleString()}</Td>
              <Td>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  po.status === 'Cleared' ? 'bg-emerald-100 text-emerald-700' :
                  po.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {po.status === 'Cleared' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {po.status}
                </span>
              </Td>
              <Td className="text-right">
                {po.status === 'Pending Remittance' ? (
                  <Button size="sm" className="text-[10px] uppercase tracking-widest py-1.5 px-3">Process</Button>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Done</span>
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}