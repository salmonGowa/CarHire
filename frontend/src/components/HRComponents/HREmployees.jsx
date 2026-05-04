import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import { 
  UserCog, UserPlus, Search, Filter, MoreHorizontal, 
  Mail, Phone, CheckCircle2, ShieldCheck, Clock, X, BadgeCheck
} from "lucide-react";

// --- Mock Data ---
const STAFF = [
  { id: "EMP-001", name: "Amina Hassan", role: "Fleet Manager", type: "Full-Time", email: "amina@drivefleet.ke", phone: "0711 222 333", status: "Active" },
  { id: "EMP-002", name: "David Kipkorir", role: "Lead Mechanic", type: "Full-Time", email: "david.k@drivefleet.ke", phone: "0722 444 555", status: "Active" },
  { id: "EMP-003", name: "Sarah Wanjiku", role: "Sales Agent", type: "Contract", email: "sarah.w@drivefleet.ke", phone: "0733 666 777", status: "On Leave" },
  { id: "EMP-004", name: "James Otieno", role: "Driver", type: "Contract", email: "james.o@drivefleet.ke", phone: "0744 888 999", status: "Active" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function HREmployees() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredStaff = STAFF.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff Directory</h2>
          <p className="text-sm text-slate-500">Manage your dealership's workforce and roles.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shadow-blue-500/20">
          <UserPlus className="w-5 h-5" /> Onboard Employee
        </Button>
      </motion.div>

      {/* ── Quick Stats ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><UserCog className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Staff</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">42</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Today</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">38</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">On Leave</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">4</h3></div>
        </div>
      </motion.div>

      {/* ── Staff Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff by name or role..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" 
              />
           </div>
           <button className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 border border-slate-200 dark:border-slate-800"><Filter className="w-4 h-4" /></button>
        </div>
        
        <Table heads={["Employee Details", "Contact", "Role & Type", "Status", "Actions"]}>
          {filteredStaff.map((emp) => (
            <Tr key={emp.id}>
              <Td label="Details">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{emp.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{emp.id}</span>
                  </div>
                </div>
              </Td>
              <Td label="Contact">
                <div className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-400 space-y-1">
                  <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {emp.email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {emp.phone}</span>
                </div>
              </Td>
              <Td label="Role">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">{emp.role}</span>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{emp.type}</span>
              </Td>
              <Td label="Status">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {emp.status}
                </span>
              </Td>
              <Td className="text-right">
                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><MoreHorizontal className="w-5 h-5" /></button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>

      {/* ── Onboard Modal Placeholder ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30"><UserPlus className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Onboard Employee</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" placeholder="Jane" />
                  <Input label="Last Name" placeholder="Doe" />
                </div>
                <Input label="Email Address" type="email" placeholder="jane@drivefleet.ke" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Role/Title" placeholder="e.g. Driver" />
                  <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Employment Type</label>
                      <select className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200">
                        <option>Full-Time</option>
                        <option>Contract</option>
                      </select>
                  </div>
                </div>
                <Button fullWidth className="mt-4" onClick={() => setIsModalOpen(false)}>Send Welcome Email</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}