import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  ClipboardList, Search, Filter, AlertTriangle, 
  Building2, Car, Calendar, ShieldAlert, ArrowUpRight
} from "lucide-react";

// --- Mock Global Data ---
const GLOBAL_RENTALS = [
  { id: "BKG-9021", dealer: "Swift Car Hire", customer: "James Mwangi", car: "Toyota Prado (KDK 123X)", dates: "Oct 24 - Oct 28", total: 48000, status: "Active" },
  { id: "BKG-9020", dealer: "Premier Auto", customer: "Sarah Wanjiku", car: "Mazda CX-5 (KDH 999Y)", dates: "Oct 20 - Oct 22", total: 17000, status: "Overdue" },
  { id: "BKG-9019", dealer: "Luxe Drive", customer: "David Kipkorir", car: "Mercedes C200 (KDG 444Z)", dates: "Oct 25 - Oct 27", total: 24000, status: "Upcoming" },
  { id: "BKG-9018", dealer: "Swift Car Hire", customer: "Amina Hassan", car: "Honda Fit (KDF 111A)", dates: "Oct 10 - Oct 15", total: 15000, status: "Completed" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminRentals() {
  const [search, setSearch] = useState("");

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Global Fleet Operations</h2>
          <p className="text-sm text-slate-500 mt-1">Cross-dealer rental monitoring and escalation management.</p>
        </div>
        <Button variant="secondary" className="gap-2 border-slate-200 dark:border-slate-800">
          <Filter className="w-4 h-4" /> Advanced Filters
        </Button>
      </motion.div>

      {/* ── Back Office KPIs ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600"><Car className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Platform Active Trips</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">1,245</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"><Calendar className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bookings Today</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">342</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600"><ShieldAlert className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-rose-600 uppercase tracking-widest">Escalated / Overdue</p><h3 className="text-2xl font-black text-rose-600">12</h3></div>
        </div>
      </motion.div>

      {/* ── Global Ledger Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search by Booking ID, Customer, or Dealer..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" 
              />
           </div>
        </div>
        
        <Table heads={["Booking Ref", "Dealership", "Customer & Car", "Schedule", "Amount", "Status", "Action"]}>
          {GLOBAL_RENTALS.map((rental) => (
            <Tr key={rental.id}>
              <Td>
                <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md">{rental.id}</span>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{rental.dealer}</span>
                </div>
              </Td>
              <Td>
                <span className="font-black text-slate-900 dark:text-white block">{rental.customer}</span>
                <span className="text-[10px] font-bold text-slate-500 mt-0.5">{rental.car}</span>
              </Td>
              <Td className="text-xs font-bold text-slate-600 dark:text-slate-400">{rental.dates}</Td>
              <Td className="font-black text-slate-900 dark:text-white">KSh {rental.total.toLocaleString()}</Td>
              <Td>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  rental.status === 'Active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                  rental.status === 'Overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                  rental.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {rental.status === 'Overdue' && <AlertTriangle className="w-3 h-3" />}
                  {rental.status}
                </span>
              </Td>
              <Td className="text-right">
                <button className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}