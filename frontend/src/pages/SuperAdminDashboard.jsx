import React from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  CarFront, 
  Users, 
  Banknote, 
  Activity, 
  Settings, 
  Plus, 
  ArrowRight, 
  TrendingUp,
  ShieldAlert,
  Server,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react";
import { Table, Td, Tr } from "../components/Card";

// --- Mock Data ---
const GLOBAL_STATS = [
  { label: "Total Dealerships", value: "42", icon: Building2, trend: "+3 this month", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
  { label: "Global Fleet Size", value: "1,204", icon: CarFront, trend: "+124 cars", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
  { label: "Active Users", value: "8,430", icon: Users, trend: "+12% growth", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/10" },
  { label: "Monthly Vol. (MTD)", value: "KSh 12.4M", icon: Banknote, trend: "+5.2% vs last month", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10" },
];

const TOP_DEALERS = [
  { name: "Premier Auto", branch: "Mombasa", revenue: "KSh 3.2M", percentage: 85 },
  { name: "Swift Car Hire", branch: "Nairobi", revenue: "KSh 2.8M", percentage: 70 },
  { name: "Luxe Drive", branch: "Nakuru", revenue: "KSh 1.9M", percentage: 55 },
  { name: "City Movers", branch: "Eldoret", revenue: "KSh 1.4M", percentage: 40 },
];

const SYSTEM_ALERTS = [
  { id: 1, type: "warning", message: "KRA API latency spike detected.", time: "10 mins ago" },
  { id: 2, type: "success", message: "Database backup completed successfully.", time: "2 hours ago" },
  { id: 3, type: "danger", message: "Failed payment webhook from M-PESA.", time: "5 hours ago" },
];

const DEALER_DIRECTORY = [
  { id: "DLR-104", name: "Alpha Rentals", plan: "Enterprise", joined: "Oct 12, 2023", cars: 142, status: "Active" },
  { id: "DLR-105", name: "Budget Wheels", plan: "Business", joined: "Sep 28, 2023", cars: 45, status: "Active" },
  { id: "DLR-106", name: "Coastal Drives", plan: "Starter", joined: "Nov 02, 2023", cars: 8, status: "Trial" },
  { id: "DLR-107", name: "Rift Valley Motors", plan: "Business", joined: "Aug 15, 2023", cars: 32, status: "Suspended" },
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

export default function SuperAdminDashboard() {
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
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Platform Command Center</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Global metrics, system health, and dealership management.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
            <Settings className="w-4 h-4" /> Global Settings
          </button>
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-500 dark:hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Onboard Dealer
          </button>
        </div>
      </motion.div>

      {/* Global Quick Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {GLOBAL_STATS.map((stat, idx) => (
          <div key={idx} className="p-5 rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md flex flex-col justify-between group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{stat.value}</h3>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{stat.trend}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Middle Row: Leaderboard & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Performing Dealers */}
        <motion.div variants={itemVariants} className="lg:col-span-2 p-6 sm:p-8 rounded-3xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-500" /> Top Performing Dealers
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Revenue generation by branch (MTD)</p>
            </div>
            <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View Full Report</button>
          </div>

          <div className="space-y-5 flex-1 relative z-10">
            {TOP_DEALERS.map((dealer, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 dark:text-slate-400 shrink-0">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-1.5">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{dealer.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{dealer.branch}</p>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{dealer.revenue}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${dealer.percentage}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* System Health & Infrastructure */}
        <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> System Health
              </h3>
              {/* Pulsing operational dot */}
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                <Server className="w-4 h-4 text-slate-400 mb-2" />
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">99.9%</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Uptime</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                <Activity className="w-4 h-4 text-slate-400 mb-2" />
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">42ms</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">API Latency</p>
              </div>
            </div>

            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Recent Alerts</h4>
            <div className="space-y-3">
              {SYSTEM_ALERTS.map((alert) => (
                <div key={alert.id} className="flex gap-3 items-start">
                  <div className="mt-0.5 shrink-0">
                    {alert.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {alert.type === "warning" && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                    {alert.type === "danger" && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">{alert.message}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Global Dealer Directory Table */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> Dealer Directory
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage subscriptions and global fleet limits.</p>
          </div>
          <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors">
            Filter Directory
          </button>
        </div>
        
        {/* Utilizing your custom responsive table */}
        <Table heads={["Dealer ID", "Dealership Info", "Subscription Plan", "Fleet Size", "Status", "Actions"]}>
          {DEALER_DIRECTORY.map((dealer, idx) => (
            <Tr key={idx}>
              <Td label="Dealer ID" className="font-bold text-slate-900 dark:text-slate-200">
                {dealer.id}
              </Td>
              <Td label="Dealership Info">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">{dealer.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Joined: {dealer.joined}</span>
              </Td>
              <Td label="Subscription Plan" className="font-medium text-slate-600 dark:text-slate-400">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                  dealer.plan === 'Enterprise' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' : 
                  dealer.plan === 'Business' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' : 
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  {dealer.plan}
                </span>
              </Td>
              <Td label="Fleet Size" className="font-bold text-slate-900 dark:text-slate-200">
                {dealer.cars} Vehicles
              </Td>
              <Td label="Status" className="sm:text-left">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  dealer.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                  dealer.status === 'Trial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                  'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                }`}>
                  {dealer.status}
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
            View All Dealerships <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

    </motion.div>
  );
}