import React from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  UserCheck, 
  CalendarDays, 
  Banknote, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  MoreHorizontal, 
  ArrowRight, 
  UserPlus,
  Briefcase,
  ShieldCheck,
  Wallet,
  Receipt,
  DollarSign
} from "lucide-react";
import { Table, Td, Tr } from "../components/Card";

// --- Mock Data ---
const STATS = [
  { label: "Total Employees", value: "48", icon: Users, trend: "+2", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
  { label: "Present Today", value: "42", icon: UserCheck, trend: "92%", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
  { label: "On Leave", value: "6", icon: CalendarDays, trend: "Normal", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10" },
  { label: "Monthly Payroll", value: "KSh 2.4M", icon: Banknote, trend: "Ready", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/10" },
];

const PAYROLL_SUMMARY = {
  month: "October 2023",
  gross: "KSh 2,450,000",
  paye: "KSh 320,000",
  nhif: "KSh 45,000",
  nssf: "KSh 52,000",
  net: "KSh 2,033,000",
  status: "Pending Approval"
};

const PAYROLL_HISTORY = [
  { month: "May", gross: 65, net: 45, grossAmt: "KSh 1.8M", netAmt: "KSh 1.4M" },
  { month: "Jun", gross: 70, net: 50, grossAmt: "KSh 1.9M", netAmt: "KSh 1.5M" },
  { month: "Jul", gross: 68, net: 48, grossAmt: "KSh 1.85M", netAmt: "KSh 1.45M" },
  { month: "Aug", gross: 85, net: 65, grossAmt: "KSh 2.1M", netAmt: "KSh 1.7M" },
  { month: "Sep", gross: 80, net: 60, grossAmt: "KSh 2.0M", netAmt: "KSh 1.6M" },
  { month: "Oct", gross: 100, net: 80, grossAmt: "KSh 2.45M", netAmt: "KSh 2.03M" }, // Current
];

const LEAVE_REQUESTS = [
  { id: 1, name: "David Mutua", role: "Senior Driver", type: "Annual Leave", dates: "Oct 28 - Nov 05", status: "Pending" },
  { id: 2, name: "Sarah Wanjiku", role: "Accountant", type: "Sick Leave", dates: "Oct 24 - Oct 25", status: "Approved" },
  { id: 3, name: "Michael Ochieng", role: "Fleet Manager", type: "Annual Leave", dates: "Nov 10 - Nov 20", status: "Pending" },
];

const STAFF_ROSTER = [
  { id: "EMP-042", name: "David Mutua", role: "Senior Driver", department: "Operations", performance: "4.8", status: "Active" },
  { id: "EMP-018", name: "Sarah Wanjiku", role: "Accountant", department: "Finance", performance: "4.9", status: "On Leave" },
  { id: "EMP-033", name: "John Kamau", role: "Mechanic", department: "Maintenance", performance: "4.5", status: "Active" },
  { id: "EMP-056", name: "Grace Njoroge", role: "Customer Service", department: "Support", performance: "4.7", status: "Active" },
  { id: "EMP-089", name: "Michael Ochieng", role: "Fleet Manager", department: "Operations", performance: "4.9", status: "Active" },
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function HRDashboard() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-8 pb-10"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">HR & Team Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your workforce, payroll, and compliance.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
            <FileText className="w-4 h-4" /> Reports
          </button>
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5">
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STATS.map((stat, idx) => (
          <div key={idx} className="p-5 rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{stat.value}</h3>
              <p className="text-xs font-semibold mt-2 text-slate-400 dark:text-slate-500">
                <span className={stat.color}>{stat.trend}</span> this month
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Middle Row: Payroll & Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        
        <motion.div variants={itemVariants} className="lg:col-span-2 p-6 sm:p-8 rounded-3xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle background glow for premium feel */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                  <Banknote className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Payroll Overview
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Estimates for {PAYROLL_SUMMARY.month}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 shadow-sm border border-amber-200 dark:border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" strokeWidth={3} /> {PAYROLL_SUMMARY.status}
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 relative z-10">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-2.5">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Gross Pay</p>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">{PAYROLL_SUMMARY.gross}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-2.5">
                <Receipt className="w-4 h-4 text-slate-400" />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">PAYE</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300">{PAYROLL_SUMMARY.paye}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 flex flex-col justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">NHIF & NSSF</p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-300">KSh 97,000</p>
            </div>
            
            {/* Net Payout Hero Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-500 shadow-lg shadow-blue-500/25 flex flex-col justify-center text-white transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2.5">
                <Wallet className="w-4 h-4 text-blue-200" />
                <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Net Payout</p>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">{PAYROLL_SUMMARY.net}</p>
            </div>
          </div>

          {/* Responsive CSS Bar Chart */}
          <div className="mb-6 relative z-10 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">6-Month Trend</h4>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-slate-700"></div> Gross</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div> Net</span>
              </div>
            </div>
            
            {/*  Graph  */}
            <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 h-32 sm:h-40 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              {PAYROLL_HISTORY.map((data, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 w-full group relative h-full justify-end">
                  
                  {/* Hover Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20 flex flex-col gap-0.5">
                    <span>Gross: {data.grossAmt}</span>
                    <span className="text-blue-400 dark:text-blue-600">Net: {data.netAmt}</span>
                  </div>
                  
                  {/* Bars Container */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-[85%] relative">
                    <div 
                      className="w-full max-w-[12px] sm:max-w-[24px] bg-slate-200 dark:bg-slate-700/50 rounded-t-md transition-all duration-500 group-hover:bg-slate-300 dark:group-hover:bg-slate-600" 
                      style={{ height: `${data.gross}%` }}
                    />
                    <div 
                      className="w-full max-w-[12px] sm:max-w-[24px] bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500 shadow-[0_0_12px_rgba(59,130,246,0.15)] group-hover:brightness-110" 
                      style={{ height: `${data.net}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-6 relative z-10">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-2 rounded-xl w-fit border border-emerald-100 dark:border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" /> KRA Compliance Checked
            </div>
            <button className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
              Run Payroll <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </motion.div>
        

        {/* Leave Requests */}
        <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-500" /> Leave Requests
            </h3>
            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center text-xs font-bold">2</span>
          </div>
          
          <div className="space-y-4 flex-1">
            {LEAVE_REQUESTS.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.name}</h4>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{req.role}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span>{req.type}</span>
                  <span>{req.dates}</span>
                </div>
                {req.status === 'Pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                    <button className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors">Approve</button>
                    <button className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">Deny</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            View All Requests
          </button>
        </motion.div>
      </div>

      {/* Bottom Row: Staff Roster Table */}
      <motion.div variants={itemVariants} className="rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Staff Roster
          </h3>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors">
              Filter by Dept
            </button>
          </div>
        </div>
        
        {/* Utilizing your custom responsive table */}
        <Table heads={["Employee ID", "Name & Role", "Department", "Performance", "Status", "Actions"]}>
          {STAFF_ROSTER.map((staff, idx) => (
            <Tr key={idx}>
              <Td label="Employee ID" className="font-bold text-slate-900 dark:text-slate-200">
                {staff.id}
              </Td>
              <Td label="Name & Role">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase shrink-0">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{staff.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{staff.role}</span>
                  </div>
                </div>
              </Td>
              <Td label="Department" className="font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5 justify-end sm:justify-start">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {staff.department}
                </div>
              </Td>
              <Td label="Performance" className="font-bold text-slate-900 dark:text-slate-200">
                <span className="flex items-center gap-1 justify-end sm:justify-start">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {staff.performance} / 5.0
                </span>
              </Td>
              <Td label="Status" className="sm:text-left">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  staff.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {staff.status}
                </span>
              </Td>
              <Td className="text-right sm:text-center">
                <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <MoreHorizontal className="w-5 h-5 ml-auto sm:mx-auto" />
                </button>
              </Td>
            </Tr>
          ))}
        </Table>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 flex justify-center">
          <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
            View All Employees <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

    </motion.div>
  );
}