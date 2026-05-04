import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import { DollarSign, Wallet, ArrowRightLeft, MoreHorizontal } from "lucide-react";

const PAYOUTS = [
  { id: "TRX-1092", dealer: "Premier Auto", volume: "KSh 45,000", commission: "KSh 4,500", net: "KSh 40,500", status: "Pending Payout" },
  { id: "TRX-1091", dealer: "Swift Car Hire", volume: "KSh 12,000", commission: "KSh 1,200", net: "KSh 10,800", status: "Paid" },
  { id: "TRX-1090", dealer: "City Movers", volume: "KSh 18,000", commission: "KSh 1,800", net: "KSh 16,200", status: "Paid" },
];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function GlobalRevenue() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Global Revenue & Payouts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform commissions and dealer disbursements.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Volume (MTD)</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">KSh 12.4M</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
          <div><p className="text-sm font-semibold text-emerald-100">Platform Cut (10%)</p><h3 className="text-2xl font-black">KSh 1.24M</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><ArrowRightLeft className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Payouts</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">KSh 40,500</h3></div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Disbursements</h3>
        </div>
        <Table heads={["Trx ID", "Dealer", "Gross Volume", "Platform Cut", "Net Payout", "Status"]}>
          {PAYOUTS.map((trx, i) => (
            <Tr key={i}>
              <Td label="ID" className="font-bold text-slate-900 dark:text-slate-200">{trx.id}</Td>
              <Td label="Dealer" className="font-semibold text-slate-800 dark:text-slate-300">{trx.dealer}</Td>
              <Td label="Volume" className="text-slate-500 dark:text-slate-400 font-medium">{trx.volume}</Td>
              <Td label="Platform Cut" className="text-emerald-600 dark:text-emerald-400 font-bold">{trx.commission}</Td>
              <Td label="Net Payout" className="text-slate-900 dark:text-slate-100 font-black">{trx.net}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  trx.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
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