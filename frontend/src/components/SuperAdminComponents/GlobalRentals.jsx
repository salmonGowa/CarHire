import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import { ClipboardList, Key, XCircle, MoreHorizontal } from "lucide-react";

const RENTALS = [
  { id: "BKG-7721A", customer: "John Doe", dealer: "Premier Auto", vehicle: "Toyota Prado", amount: "KSh 45,000", status: "Active" },
  { id: "BKG-7722B", customer: "Sarah Wanjiku", dealer: "Swift Car Hire", vehicle: "Honda Fit", amount: "KSh 12,000", status: "Completed" },
  { id: "BKG-7723C", customer: "Michael Ochieng", dealer: "City Movers", vehicle: "Mazda CX-5", amount: "KSh 18,000", status: "Cancelled" },
];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function GlobalRentals() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Global Rentals</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cross-dealer booking and reservation tracking.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Key className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Bookings</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">840</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><ClipboardList className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed (Today)</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">124</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center"><XCircle className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cancelled (Today)</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">12</h3></div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <Table heads={["Booking ID", "Customer", "Dealer", "Vehicle", "Amount", "Status"]}>
          {RENTALS.map((rental, i) => (
            <Tr key={i}>
              <Td label="ID" className="font-bold text-slate-900 dark:text-slate-200">{rental.id}</Td>
              <Td label="Customer" className="font-semibold text-slate-800 dark:text-slate-300">{rental.customer}</Td>
              <Td label="Dealer" className="text-slate-500 dark:text-slate-400 font-medium">{rental.dealer}</Td>
              <Td label="Vehicle" className="text-slate-500 dark:text-slate-400 font-medium">{rental.vehicle}</Td>
              <Td label="Amount" className="text-slate-900 dark:text-slate-100 font-black">{rental.amount}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  rental.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                  rental.status === 'Active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 
                  'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                }`}>
                  {rental.status}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}