import React, { useState } from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  BarChart2, Download, TrendingUp, Users, 
  Wallet, ShieldCheck, FileText, Calendar, 
  ArrowUpRight, Filter,
  Banknote
} from "lucide-react";

// --- Mock Data ---
const HEADCOUNT_DATA = [
  { month: "May", count: 32 },
  { month: "Jun", count: 35 },
  { month: "Jul", count: 34 },
  { month: "Aug", count: 38 },
  { month: "Sep", count: 40 },
  { month: "Oct", count: 42 },
];

const AVAILABLE_REPORTS = [
  { id: "REP-01", name: "Monthly Payroll Summary", type: "Financial", date: "Oct 31, 2023", size: "1.2 MB", format: "PDF" },
  { id: "REP-02", name: "Employee Attendance Log", type: "Operational", date: "Oct 30, 2023", size: "850 KB", format: "CSV" },
  { id: "REP-03", name: "KRA/NHIF Statutory Remittances", type: "Compliance", date: "Oct 28, 2023", size: "2.4 MB", format: "PDF" },
  { id: "REP-04", name: "Q3 Headcount & Attrition", type: "Strategic", date: "Sep 30, 2023", size: "3.1 MB", format: "PDF" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function HRReports() {
  const maxCount = Math.max(...HEADCOUNT_DATA.map(d => d.count));

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">HR Analytics</h2>
          <p className="text-sm text-slate-500">Workforce insights, payroll trends, and compliance reporting.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="gap-2"><Calendar className="w-4 h-4" /> This Quarter</Button>
          <Button className="gap-2 shadow-blue-500/20"><Download className="w-4 h-4" /> Export Master Report</Button>
        </div>
      </motion.div>

      {/* ── Key Performance Indicators (KPIs) ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col gap-4 shadow-sm group hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600"><Users className="w-5 h-5" /></div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg"><ArrowUpRight className="w-3 h-3" /> 5%</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">42</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Headcount</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col gap-4 shadow-sm group hover:border-rose-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">YTD Average</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">2.4%</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Attrition Rate</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex flex-col gap-4 shadow-sm group hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"><ShieldCheck className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Audited</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">100%</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Compliance Score</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col gap-4 shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <Wallet className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
             <div className="p-3 rounded-2xl bg-white/20"><Banknote className="w-5 h-5" /></div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black">250k</h3>
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mt-1">Monthly Payroll (KSh)</p>
          </div>
        </div>
      </motion.div>

      {/* ── Visual Analytics Grid ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Headcount Growth Chart */}
        <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Headcount Growth</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-3 h-3 rounded-md bg-blue-500" /> Active Employees
            </div>
          </div>
          <div className="flex items-end justify-between h-48 gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-2">
            {HEADCOUNT_DATA.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black px-3 py-1 rounded-xl shadow-xl pointer-events-none z-10">
                  {d.count} Staff
                </div>
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: `${(d.count / maxCount) * 100}%` }} 
                  className="w-full max-w-[40px] bg-blue-500/20 dark:bg-blue-500/10 border-t-4 border-blue-500 rounded-t-xl group-hover:bg-blue-500 transition-all duration-500" 
                />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Distribution (Mock Donut Replacement) */}
        <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm flex flex-col justify-between">
           <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6">Workforce Distribution</h3>
           <div className="space-y-6 flex-1 flex flex-col justify-center">
              <div>
                 <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>Drivers (Chauffeurs)</span> <span>55%</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "55%" }} className="h-full bg-blue-500" />
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>Mechanics & Fleet Maintenance</span> <span>25%</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "25%" }} className="h-full bg-emerald-500" />
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>Admin, Sales & HR</span> <span>20%</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "20%" }} className="h-full bg-amber-500" />
                 </div>
              </div>
           </div>
        </div>
      </motion.div>

      {/* ── Report Generation Vault ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generated Reports</h3>
          <button className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 border border-slate-200 dark:border-slate-800">
             <Filter className="w-4 h-4" />
          </button>
        </div>
        
        <Table heads={["Report Name", "Category", "Generated On", "Format", "Actions"]}>
          {AVAILABLE_REPORTS.map((report) => (
            <Tr key={report.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{report.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{report.id} • {report.size}</span>
                  </div>
                </div>
              </Td>
              <Td>
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-black text-slate-500 tracking-widest uppercase">
                  {report.type}
                </span>
              </Td>
              <Td className="text-sm font-bold text-slate-600 dark:text-slate-400">{report.date}</Td>
              <Td>
                 <span className={`text-xs font-black uppercase ${report.format === 'PDF' ? 'text-rose-500' : 'text-emerald-500'}`}>
                   {report.format}
                 </span>
              </Td>
              <Td className="text-right">
                <Button variant="secondary" className="text-xs px-4 py-1.5 font-bold uppercase tracking-widest flex items-center gap-2 ml-auto">
                  <Download className="w-3 h-3" /> Download
                </Button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}