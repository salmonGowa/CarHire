import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  CalendarDays, CheckCircle2, Clock, XCircle, 
  Search, Filter, Check, X, CalendarX2, UserCheck
} from "lucide-react";

// --- Mock Data ---
const DAILY_ATTENDANCE = [
  { id: "EMP-001", name: "Amina Hassan", role: "Fleet Manager", timeIn: "07:45 AM", timeOut: "---", status: "On Time" },
  { id: "EMP-002", name: "David Kipkorir", role: "Lead Mechanic", timeIn: "08:15 AM", timeOut: "---", status: "Late" },
  { id: "EMP-004", name: "James Otieno", role: "Driver", timeIn: "06:30 AM", timeOut: "---", status: "On Time" },
];

const INITIAL_LEAVES = [
  { id: "LV-101", name: "Sarah Wanjiku", role: "Sales Agent", type: "Annual Leave", dates: "Oct 25 - Nov 05", days: 10, status: "Pending" },
  { id: "LV-102", name: "Brian Kamau", role: "Driver", type: "Sick Leave", dates: "Oct 24 - Oct 25", days: 2, status: "Approved" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function HRAttendance() {
  const [view, setView] = useState("daily"); // 'daily' | 'leaves'
  const [leaves, setLeaves] = useState(INITIAL_LEAVES);
  const [search, setSearch] = useState("");

  const handleLeaveAction = (id, newStatus) => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Attendance & Leaves</h2>
          <p className="text-sm text-slate-500">Monitor daily clock-ins and manage time-off requests.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button onClick={() => setView("daily")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === "daily" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            Daily Roster
          </button>
          <button onClick={() => setView("leaves")} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === "leaves" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            Leave Requests
          </button>
        </div>
      </motion.div>

      {/* ── Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><UserCheck className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Present Today</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">38 / 42</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center"><CalendarX2 className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">On Leave</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">4</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Requests</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{leaves.filter(l => l.status === 'Pending').length}</h3></div>
        </div>
      </motion.div>

      {/* ── Dynamic Table Area ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${view === 'daily' ? 'attendance' : 'leaves'}...`} 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" 
              />
           </div>
           <button className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><Filter className="w-4 h-4" /></button>
        </div>

        {view === "daily" ? (
          <Table heads={["Employee", "Time In", "Time Out", "Status"]}>
            {DAILY_ATTENDANCE.map((record) => (
              <Tr key={record.id}>
                <Td label="Employee">
                  <span className="font-bold text-slate-900 dark:text-white block">{record.name}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{record.role}</span>
                </Td>
                <Td label="Time In" className="font-bold text-slate-700 dark:text-slate-300">{record.timeIn}</Td>
                <Td label="Time Out" className="font-bold text-slate-500">{record.timeOut}</Td>
                <Td label="Status">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    record.status === 'On Time' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {record.status}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        ) : (
          <Table heads={["Employee", "Leave Details", "Duration", "Status", "Actions"]}>
            {leaves.map((leave) => (
              <Tr key={leave.id}>
                <Td label="Employee">
                  <span className="font-bold text-slate-900 dark:text-white block">{leave.name}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{leave.role}</span>
                </Td>
                <Td label="Leave Details">
                  <span className="font-bold text-blue-600 dark:text-blue-400 block">{leave.type}</span>
                  <span className="text-xs text-slate-500 font-mono">{leave.id}</span>
                </Td>
                <Td label="Duration">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{leave.dates}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{leave.days} Days</span>
                </Td>
                <Td label="Status">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                    leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {leave.status}
                  </span>
                </Td>
                <Td className="text-right">
                  {leave.status === 'Pending' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleLeaveAction(leave.id, 'Approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:scale-105 transition-all"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleLeaveAction(leave.id, 'Rejected')} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:scale-105 transition-all"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processed</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </motion.div>
    </motion.div>
  );
}