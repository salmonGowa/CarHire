import React from "react";
import { type Variants, motion } from "framer-motion";
import { CreditCard, TrendingUp, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Table, Td, Tr } from "../Card";

const SUBSCRIPTIONS = [
  { dealer: "Premier Auto", plan: "Enterprise", mrr: "KSh 25,000", renewal: "Nov 15, 2023", status: "Paid" },
  { dealer: "Swift Car Hire", plan: "Business", mrr: "KSh 9,000", renewal: "Nov 12, 2023", status: "Paid" },
  { dealer: "Coastal Drives", plan: "Starter", mrr: "KSh 3,000", renewal: "Oct 28, 2023", status: "Overdue" },
];

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function SubscriptionsManagement() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">SaaS Subscriptions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Platform billing and recurring revenue.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-sm font-semibold text-blue-100">Total MRR</p><h3 className="text-2xl font-black">KSh 345,000</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Subs</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">38</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue Payments</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">4</h3></div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <Table heads={["Dealer", "Plan Tier", "MRR", "Next Renewal", "Status", "Actions"]}>
          {SUBSCRIPTIONS.map((sub, i) => (
            <Tr key={i}>
              <Td label="Dealer" className="font-bold text-slate-900 dark:text-slate-200">{sub.dealer}</Td>
              <Td label="Plan Tier"><span className="text-blue-600 dark:text-blue-400 font-bold">{sub.plan}</span></Td>
              <Td label="MRR" className="text-slate-900 dark:text-slate-100 font-black">{sub.mrr}</Td>
              <Td label="Next Renewal" className="text-slate-500 dark:text-slate-400 font-medium">{sub.renewal}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                  {sub.status}
                </span>
              </Td>
              <Td className="text-right sm:text-center">
                <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><MoreHorizontal className="w-5 h-5 ml-auto sm:mx-auto" /></button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}