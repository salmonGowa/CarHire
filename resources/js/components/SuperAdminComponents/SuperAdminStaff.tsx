import React, { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  UserCog, UserPlus, Shield, Search, Filter, 
  MoreHorizontal, Mail, KeyRound, Ban
} from "lucide-react";

// --- Mock Internal Staff Data ---
const PLATFORM_STAFF = [
  { id: "SA-01", name: "System Administrator", email: "admin@drivefleet.ke", role: "Super Admin", level: "Tier 1 (All)", status: "Active" },
  { id: "SA-02", name: "Grace Omondi", email: "grace.o@drivefleet.ke", role: "Support Lead", level: "Tier 2 (Support)", status: "Active" },
  { id: "SA-03", name: "Peter Njuguna", email: "peter.n@drivefleet.ke", role: "Financial Controller", level: "Tier 2 (Finance)", status: "Active" },
  { id: "SA-04", name: "John Doe", email: "john.d@drivefleet.ke", role: "Onboarding Agent", level: "Tier 3 (Read-Only)", status: "Suspended" },
];

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminStaff() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Internal Staff</h2>
          <p className="text-sm text-slate-500 mt-1">Manage platform administrators and their access levels.</p>
        </div>
        <Button className="flex items-center gap-2 shadow-blue-500/20">
          <UserPlus className="w-5 h-5" /> Add Staff Member
        </Button>
      </motion.div>

      {/* ── Security KPIs ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600"><UserCog className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Staff</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">24</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600"><Shield className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Super Admins</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">3</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"><KeyRound className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">MFA Adoption</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">100%</h3></div>
        </div>
      </motion.div>

      {/* ── Staff Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search staff members..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
           </div>
           <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Filter className="w-5 h-5" /></button>
        </div>
        
        <Table heads={["Staff Member", "Platform Role", "Access Level", "Status", "Actions"]}>
          {PLATFORM_STAFF.map((staff) => (
            <Tr key={staff.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-600 text-white flex items-center justify-center font-black">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{staff.name}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mt-0.5">
                      <Mail className="w-3 h-3" /> {staff.email}
                    </span>
                  </div>
                </div>
              </Td>
              <Td>
                 <span className="font-bold text-slate-700 dark:text-slate-300">{staff.role}</span>
              </Td>
              <Td>
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                  staff.level.includes("Tier 1") ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' :
                  staff.level.includes("Tier 2") ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20' :
                  'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}>
                  {staff.level}
                </span>
              </Td>
              <Td>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                }`}>
                  {staff.status === 'Suspended' && <Ban className="w-3 h-3" />}
                  {staff.status}
                </span>
              </Td>
              <Td className="text-right">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}