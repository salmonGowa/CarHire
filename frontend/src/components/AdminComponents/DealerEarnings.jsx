import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import { 
  DollarSign, TrendingUp, ArrowUpRight, Wallet, 
  PieChart, Download, Filter, Calendar, Landmark, 
  CreditCard, ArrowDownRight, Activity
} from "lucide-react";
import Button from "../Button";

const REVENUE_DATA = [
  { month: "May", gross: 120000, net: 88800 },
  { month: "Jun", gross: 150000, net: 111000 },
  { month: "Jul", gross: 135000, net: 99900 },
  { month: "Aug", gross: 190000, net: 140600 },
  { month: "Sep", gross: 175000, net: 129500 },
  { month: "Oct", gross: 240000, net: 177600 },
];

const TRANSACTIONS = [
  { id: "TRX-901", client: "Alex Mutua", gross: 45000, fee: 4500, tax: 7200, net: 33300, date: "Oct 24, 2023", status: "Cleared" },
  { id: "TRX-902", client: "Luxe Corp", gross: 120000, fee: 12000, tax: 19200, net: 88800, date: "Oct 22, 2023", status: "Pending Payout" },
  { id: "TRX-903", client: "Sarah W.", gross: 15000, fee: 1500, tax: 2400, net: 11100, date: "Oct 20, 2023", status: "Cleared" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DealerEarnings() {
  const maxGross = Math.max(...REVENUE_DATA.map(d => d.gross));

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Earnings & Payouts</h2>
          <p className="text-sm text-slate-500">Track gross volume, platform fees, and net liquidity.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> This Month</Button>
          <Button className="flex items-center gap-2 shadow-blue-500/20"><Download className="w-4 h-4" /> Export Ledger</Button>
        </div>
      </motion.div>

      {/* ── Financial Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Earnings Hero Card */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-emerald-100 text-xs font-black uppercase tracking-widest">Net Available (MTD)</p>
              <Wallet className="w-6 h-6 text-emerald-200" />
            </div>
            <h3 className="text-4xl font-black mb-2">KSh 177,600</h3>
            <div className="flex items-center gap-2 text-emerald-100 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center bg-black/20 px-2 py-1 rounded-lg"><ArrowUpRight className="w-3 h-3 mr-1" /> +18.4%</span>
              <span>vs Last Month</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/20 relative z-10 flex items-center justify-between text-sm font-bold">
            <span>Next Platform Disbursement:</span>
            <span className="text-white bg-black/20 px-3 py-1 rounded-xl">Oct 28, 2023</span>
          </div>
          <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 pointer-events-none" />
        </div>

        {/* Deductions Breakdown */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-between hover:border-blue-500/50 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600"><Activity className="w-5 h-5" /></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Gross Volume</p>
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-4">KSh 240,000</h3>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-500">
               <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> 14 Active Rentals
            </div>
          </div>

          <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-between hover:border-rose-500/50 transition-colors">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600"><Landmark className="w-5 h-5" /></div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Deductions</p>
              </div>
              <h3 className="text-3xl font-black text-rose-500 mt-4">KSh 62,400</h3>
            </div>
            <div className="mt-6 space-y-2">
               <div className="flex justify-between text-xs font-bold text-slate-500">
                 <span>Platform Fee (10%)</span><span className="text-slate-700 dark:text-slate-300">KSh 24,000</span>
               </div>
               <div className="flex justify-between text-xs font-bold text-slate-500">
                 <span>KRA VAT (16%)</span><span className="text-slate-700 dark:text-slate-300">KSh 38,400</span>
               </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Advanced Visual Trend Chart ── */}
      <motion.div variants={itemVariants} className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Earnings Momentum</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-800" /> Gross
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" /> Net Earnings
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between h-56 gap-2 sm:gap-6 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          {REVENUE_DATA.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-4 group relative h-full justify-end">
              {/* Tooltip */}
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black px-3 py-2 rounded-xl shadow-xl pointer-events-none z-10 flex flex-col items-center gap-1">
                <span className="text-emerald-400 dark:text-emerald-600">Net: {d.net / 1000}k</span>
                <span className="text-[9px] text-slate-400">Gross: {d.gross / 1000}k</span>
              </div>
              
              {/* Stacked Bar */}
              <div className="w-full max-w-[48px] flex items-end justify-center relative h-[85%]">
                 <motion.div initial={{ height: 0 }} animate={{ height: `${(d.gross / maxGross) * 100}%` }} className="absolute bottom-0 w-full bg-slate-100 dark:bg-slate-800/80 rounded-t-xl transition-all duration-700" />
                 <motion.div initial={{ height: 0 }} animate={{ height: `${(d.net / maxGross) * 100}%` }} className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl group-hover:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-700" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.month}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Transaction Ledger ── */}
      <motion.div variants={itemVariants} className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Ledger Entries</h3>
          <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><Filter className="w-4 h-4" /></button>
        </div>
        <Table heads={["TRX ID", "Client", "Gross Amount", "Platform (10%)", "KRA VAT (16%)", "Net Payout", "Status"]}>
          {TRANSACTIONS.map((trx) => (
            <Tr key={trx.id}>
              <Td className="font-mono font-bold text-blue-500">{trx.id}</Td>
              <Td className="font-bold text-slate-900 dark:text-white">{trx.client}</Td>
              <Td className="text-slate-500 font-medium">KSh {trx.gross.toLocaleString()}</Td>
              <Td className="text-amber-500 font-bold">- KSh {trx.fee.toLocaleString()}</Td>
              <Td className="text-rose-500 font-bold">- KSh {trx.tax.toLocaleString()}</Td>
              <Td className="text-emerald-600 dark:text-emerald-400 font-black">KSh {trx.net.toLocaleString()}</Td>
              <Td>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${trx.status === 'Cleared' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {trx.status}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}