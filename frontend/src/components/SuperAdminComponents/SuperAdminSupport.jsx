import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import { 
  LifeBuoy, MessageSquare, AlertTriangle, Clock, 
  Search, Filter, CheckCircle2, User, Building2, MoreVertical
} from "lucide-react";

// --- Mock Support Data ---
const TICKETS = [
  { id: "TKT-4921", origin: "Dealer", name: "Swift Car Hire", subject: "Payout failed for Oct 21 cycle", priority: "High", status: "Open", time: "2 hours ago" },
  { id: "TKT-4920", origin: "Customer", name: "Sarah Wanjiku", subject: "Roadside assistance required (Nairobi)", priority: "Urgent", status: "In Progress", time: "15 mins ago" },
  { id: "TKT-4919", origin: "Customer", name: "David Kipkorir", subject: "Dispute regarding late fee", priority: "Medium", status: "Open", time: "1 day ago" },
  { id: "TKT-4918", origin: "Dealer", name: "Premier Auto", subject: "Update account banking details", priority: "Low", status: "Resolved", time: "3 days ago" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminSupport() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Global Support Center</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and route tickets from both customers and dealerships.</p>
        </div>
      </motion.div>

      {/* ── Ticket KPIs ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-rose-500"><AlertTriangle className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Urgent / High</span></div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">12</h3>
        </div>
        <div className="p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-blue-500"><MessageSquare className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Open Tickets</span></div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">48</h3>
        </div>
        <div className="p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-amber-500"><Clock className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Avg Response</span></div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">1.2h</h3>
        </div>
        <div className="p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col justify-center shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-emerald-500"><CheckCircle2 className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Resolved (7d)</span></div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">314</h3>
        </div>
      </motion.div>

      {/* ── Support Queue Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search tickets..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
           </div>
           <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Filter className="w-5 h-5" /></button>
        </div>
        
        <Table heads={["Ticket Ref", "Reporter", "Subject & Time", "Priority", "Status", "Action"]}>
          {TICKETS.map((ticket) => (
            <Tr key={ticket.id}>
              <Td>
                <span className="font-mono text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-md tracking-widest">{ticket.id}</span>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${ticket.origin === 'Dealer' ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {ticket.origin === 'Dealer' ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">{ticket.name}</span>
                  </div>
                </div>
              </Td>
              <Td>
                <span className="font-bold text-slate-700 dark:text-slate-300 block">{ticket.subject}</span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">{ticket.time}</span>
              </Td>
              <Td>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                  ticket.priority === 'Urgent' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' :
                  ticket.priority === 'High' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' :
                  'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  {ticket.priority}
                </span>
              </Td>
              <Td>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                  ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {ticket.status}
                </span>
              </Td>
              <Td className="text-right">
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}