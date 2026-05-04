import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  CreditCard, Smartphone, Receipt, Download, 
  Plus, CheckCircle2, Clock, ShieldCheck, ArrowRight
} from "lucide-react";

// --- Mock Data ---
const INVOICES = [
  { id: "INV-2023-881", date: "Oct 24, 2023", vehicle: "Toyota Prado", amount: "KSh 45,000", status: "Paid", method: "M-PESA" },
  { id: "INV-2023-742", date: "Sep 15, 2023", vehicle: "Mazda CX-5", amount: "KSh 17,000", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-2023-690", date: "Aug 02, 2023", vehicle: "Honda Fit", amount: "KSh 10,500", status: "Paid", method: "M-PESA" },
  { id: "INV-2023-904", date: "Oct 30, 2023", vehicle: "Mercedes C200", amount: "KSh 24,000", status: "Pending", method: "---" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CustomerBilling() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Billing & Payments</h2>
          <p className="text-sm text-slate-500">Manage your payment methods and download receipts.</p>
        </div>
      </motion.div>

      {/* ── Financial Summary ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-[#0B1120] dark:to-slate-900 text-white shadow-xl border border-slate-800 flex flex-col justify-between">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Outstanding Balance</p>
          <h3 className="text-4xl font-black mb-4">KSh 24,000</h3>
          <Button className="w-full bg-blue-600 hover:bg-blue-500 border-none shadow-lg shadow-blue-500/20">
            Pay Now
          </Button>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* M-PESA Card */}
          <div className="p-6 rounded-[2rem] border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"><Smartphone className="w-5 h-5" /></div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-200 dark:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Default</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-black text-slate-900 dark:text-white">M-PESA Express</p>
              <p className="text-xs font-bold text-slate-500 mt-1">+254 712 *** 678</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          </div>

          {/* Add New Method */}
          <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-600 transition-colors">
              <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Add Payment Method</p>
            <p className="text-xs text-slate-500 mt-1">Credit Card or Mobile Money</p>
          </div>
        </div>
      </motion.div>

      {/* ── Invoice History ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white">Billing History</h3>
           <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
             <ShieldCheck className="w-4 h-4 text-emerald-500" /> All invoices are KRA-compliant
           </p>
        </div>
        
        <Table heads={["Invoice Details", "Vehicle", "Amount", "Status", "Actions"]}>
          {INVOICES.map((inv) => (
            <Tr key={inv.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><Receipt className="w-5 h-5" /></div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{inv.id}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{inv.date}</span>
                  </div>
                </div>
              </Td>
              <Td className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.vehicle}</Td>
              <Td>
                <span className="font-black text-slate-900 dark:text-white block">{inv.amount}</span>
                <span className="text-[10px] font-bold text-slate-400">{inv.method}</span>
              </Td>
              <Td>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {inv.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {inv.status}
                </span>
              </Td>
              <Td className="text-right">
                <button className="flex items-center justify-end gap-1 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-blue-500 transition-all font-bold text-xs uppercase tracking-widest ml-auto group">
                  <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> PDF
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}