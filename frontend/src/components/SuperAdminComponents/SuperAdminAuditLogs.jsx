import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  ShieldAlert, Search, Filter, Server, 
  User, Download, AlertTriangle, Activity
} from "lucide-react";

// --- Mock Audit Data ---
const AUDIT_LOGS = [
  { id: "LOG-9921", time: "Oct 25, 14:32:01", actor: "admin@drivefleet.ke", action: "Updated Global Commission Rate to 10%", ip: "192.168.1.1", severity: "Warning" },
  { id: "LOG-9920", time: "Oct 25, 12:15:44", actor: "System", action: "Automated Payout Run (PO-102) Successful", ip: "Internal", severity: "Info" },
  { id: "LOG-9919", time: "Oct 25, 09:05:12", actor: "Luxe Drive (Dealer)", action: "Added new vehicle (KDG 444Z)", ip: "41.90.12.33", severity: "Info" },
  { id: "LOG-9918", time: "Oct 24, 23:45:00", actor: "Unknown", action: "Failed login attempt (5x)", ip: "103.45.22.1", severity: "Critical" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminAuditLogs() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Audit Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Immutable record of all platform activities and security events.</p>
        </div>
        <Button variant="secondary" className="gap-2 border-slate-200 dark:border-slate-800"><Download className="w-4 h-4" /> Export Logs</Button>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search logs by IP, Actor, or Action..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
           </div>
           <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Filter className="w-5 h-5" /></button>
        </div>
        
        <Table heads={["Timestamp & ID", "Actor & IP", "Event Action", "Severity"]}>
          {AUDIT_LOGS.map((log) => (
            <Tr key={log.id}>
              <Td>
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 block">{log.time}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.id}</span>
              </Td>
              <Td>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" /> {log.actor}</span>
                  <span className="font-mono text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5"><Server className="w-3 h-3 text-slate-400" /> {log.ip}</span>
                </div>
              </Td>
              <Td>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.action}</span>
              </Td>
              <Td>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                  log.severity === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' :
                  log.severity === 'Warning' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' :
                  'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}>
                  {log.severity === 'Critical' && <AlertTriangle className="w-3 h-3" />}
                  {log.severity === 'Warning' && <ShieldAlert className="w-3 h-3" />}
                  {log.severity === 'Info' && <Activity className="w-3 h-3" />}
                  {log.severity}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}