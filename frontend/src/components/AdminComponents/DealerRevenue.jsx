import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import { 
  DollarSign, Wallet, ArrowUpRight, TrendingUp, 
  Download, Filter, Calendar, CheckCircle2, Clock 
} from "lucide-react";

// --- Mock Data ---
const REVENUE_HISTORY = [
  { month: "May", earnings: 180000, color: "bg-blue-400" },
  { month: "Jun", earnings: 210000, color: "bg-blue-400" },
  { month: "Jul", earnings: 195000, color: "bg-blue-400" },
  { month: "Aug", earnings: 245000, color: "bg-blue-500" },
  { month: "Sep", earnings: 220000, color: "bg-blue-400" },
  { month: "Oct", earnings: 280000, color: "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]" },
];

const RECENT_TRANSACTIONS = [
  { id: "TRX-4421", client: "John Doe", amount: "KSh 15,000", commission: "KSh 1,500", net: "KSh 13,500", date: "Oct 22, 2023", status: "Completed" },
  { id: "TRX-4420", client: "Jane Smith", amount: "KSh 45,000", commission: "KSh 4,500", net: "KSh 40,500", date: "Oct 21, 2023", status: "Completed" },
  { id: "TRX-4419", client: "Michael O.", amount: "KSh 12,000", commission: "KSh 1,200", net: "KSh 10,800", date: "Oct 20, 2023", status: "Pending" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DealerRevenue() {
  const maxEarnings = Math.max(...REVENUE_HISTORY.map(h => h.earnings));

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Earnings & Revenue</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed financial performance for your dealership.</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-950 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all">
          <Download className="w-4 h-4" /> Export Ledger
        </button>
      </motion.div>

      {/* Analytics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900 dark:text-white">6-Month Earnings Trend</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
              <ArrowUpRight className="w-3 h-3" /> +14.2%
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 h-48 border-b border-slate-100 dark:border-slate-800 pb-2">
            {REVENUE_HISTORY.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 w-full group relative">
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-xl pointer-events-none whitespace-nowrap">
                  KSh {data.earnings.toLocaleString()}
                </div>
                <div 
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${data.color}`}
                  style={{ height: `${(data.earnings / maxEarnings) * 100}%` }}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Column */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl border bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <p className="text-xs font-bold uppercase text-blue-100 tracking-widest mb-1">Monthly Volume</p>
            <h3 className="text-2xl font-black">KSh 280,000</h3>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-blue-100">
              <span>Platform Fee (10%)</span>
              <span>- KSh 28,000</span>
            </div>
          </div>
          <div className="p-6 rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Net Earnings (MTD)</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">KSh 252,000</h3>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[75%]" />
              </div>
              <span className="text-[10px] font-bold text-slate-400">75%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Transactions Table */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
          <button className="text-sm font-bold text-blue-600 hover:underline">View All</button>
        </div>
        <Table heads={["Transaction ID", "Client", "Gross Amount", "Platform Cut", "Net Payout", "Status"]}>
          {RECENT_TRANSACTIONS.map((trx) => (
            <Tr key={trx.id}>
              <Td label="Transaction ID" className="font-mono font-bold text-blue-500">{trx.id}</Td>
              <Td label="Client" className="font-bold text-slate-900 dark:text-white">{trx.client}</Td>
              <Td label="Gross" className="text-slate-500 dark:text-slate-400 font-medium">{trx.amount}</Td>
              <Td label="Commission" className="text-rose-500 font-bold">-{trx.commission}</Td>
              <Td label="Net Payout" className="text-emerald-600 dark:text-emerald-400 font-black">{trx.net}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${trx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
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