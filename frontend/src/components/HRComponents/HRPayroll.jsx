import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  Banknote, Download, Filter, Search, 
  Calculator, CheckCircle2, AlertCircle, FileText
} from "lucide-react";

// --- Mock Payroll Data (KRA/NHIF/NSSF Formatted) ---
const PAYROLL = [
  { id: "EMP-001", name: "Amina Hassan", role: "Fleet Manager", gross: 120000, paye: 30000, nhif: 1700, nssf: 1080, net: 87220, status: "Cleared" },
  { id: "EMP-002", name: "David Kipkorir", role: "Lead Mechanic", gross: 85000, paye: 18000, nhif: 1200, nssf: 1080, net: 64720, status: "Cleared" },
  { id: "EMP-004", name: "James Otieno", role: "Driver", gross: 45000, paye: 6500, nhif: 1000, nssf: 1080, net: 36420, status: "Pending" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function HRPayroll() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payroll & Compliance</h2>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fully synced with KRA, NHIF, and NSSF rates.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2"><Calculator className="w-4 h-4" /> Run Payroll</Button>
          <Button className="gap-2 shadow-blue-500/20"><Download className="w-4 h-4" /> Export CSV</Button>
        </div>
      </motion.div>

      {/* ── Payroll Overview Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-xl flex flex-col justify-between">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Total Gross Payroll</p>
          <h3 className="text-4xl font-black mb-4">KSh 250,000</h3>
          <div className="pt-4 border-t border-white/10 flex justify-between text-xs font-bold text-slate-300">
            <span>October 2023 Cycle</span>
            <span>42 Employees</span>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-[2rem] border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-[#0B1120] flex flex-col justify-between">
            <p className="text-rose-600 dark:text-rose-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
               <AlertCircle className="w-4 h-4" /> Statutory Deductions
            </p>
            <div className="space-y-3">
               <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                 <span>KRA (PAYE)</span><span>KSh 54,500</span>
               </div>
               <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                 <span>NHIF</span><span>KSh 3,900</span>
               </div>
               <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                 <span>NSSF</span><span>KSh 3,240</span>
               </div>
            </div>
          </div>
          
          <div className="p-6 rounded-[2rem] border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-[#0B1120] flex flex-col justify-between">
             <div>
                <p className="text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Banknote className="w-4 h-4" /> Net Disbursed
                </p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">KSh 188,360</h3>
             </div>
             <div className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-xs font-bold bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl w-fit">
               <CheckCircle2 className="w-4 h-4" /> Bank Transfer Initiated
             </div>
          </div>
        </div>
      </motion.div>

      {/* ── Employee Payroll Ledger ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search employee..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
           </div>
        </div>
        
        <Table heads={["Employee", "Gross Pay", "PAYE", "NHIF & NSSF", "Net Pay", "Status", "Payslip"]}>
          {PAYROLL.map((slip) => (
            <Tr key={slip.id}>
              <Td>
                <span className="font-bold text-slate-900 dark:text-white block">{slip.name}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{slip.role}</span>
              </Td>
              <Td className="text-slate-600 dark:text-slate-400 font-bold">KSh {slip.gross.toLocaleString()}</Td>
              <Td className="text-rose-500 font-bold">-KSh {slip.paye.toLocaleString()}</Td>
              <Td>
                 <div className="flex flex-col text-xs font-bold text-amber-600">
                    <span>-KSh {slip.nhif.toLocaleString()} <span className="text-[9px] text-slate-400 uppercase">(NHIF)</span></span>
                    <span>-KSh {slip.nssf.toLocaleString()} <span className="text-[9px] text-slate-400 uppercase">(NSSF)</span></span>
                 </div>
              </Td>
              <Td className="font-black text-emerald-600 dark:text-emerald-400 text-base">KSh {slip.net.toLocaleString()}</Td>
              <Td>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  slip.status === 'Cleared' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {slip.status}
                </span>
              </Td>
              <Td className="text-right">
                <button className="flex items-center justify-end gap-1 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-blue-500 transition-all font-bold text-xs uppercase tracking-widest ml-auto">
                  <FileText className="w-4 h-4" /> PDF
                </button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}