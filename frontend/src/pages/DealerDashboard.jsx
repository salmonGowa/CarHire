import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  CarFront, 
  Wrench, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Banknote,
  MoreHorizontal,
  Download,
  Filter,
  CreditCard,
  Smartphone
} from "lucide-react";

// --- Mock Data ---
const STATS = [
  { label: "Active Rentals", value: "24", icon: CarFront, trend: "+12%", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
  { label: "Today's Revenue", value: "KSh 45,000", icon: TrendingUp, trend: "+8%", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
  { label: "Pending Payments", value: "3", icon: Clock, trend: "-2", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10" },
  { label: "In Maintenance", value: "2", icon: Wrench, trend: "Stable", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/10" },
];

const WEEKLY_REVENUE = [
  { day: "Mon", amount: "45k", height: "60%" },
  { day: "Tue", amount: "52k", height: "75%" },
  { day: "Wed", amount: "38k", height: "45%" },
  { day: "Thu", amount: "65k", height: "90%" },
  { day: "Fri", amount: "48k", height: "65%" },
  { day: "Sat", amount: "78k", height: "100%" },
  { day: "Sun", amount: "58k", height: "80%" },
];

const RECENT_PAYMENTS = [
  { id: "TRX-8921", name: "John Doe", vehicle: "Toyota Axio", amount: "KSh 15,000", method: "M-PESA", icon: Smartphone, date: "Today, 10:24 AM", status: "Completed" },
  { id: "TRX-8920", name: "Jane Smith", vehicle: "Mazda CX-5", amount: "KSh 45,000", method: "Card", icon: CreditCard, date: "Today, 09:12 AM", status: "Completed" },
  { id: "TRX-8919", name: "Michael Ochieng", vehicle: "Nissan Note", amount: "KSh 12,500", method: "M-PESA", icon: Smartphone, date: "Yesterday", status: "Pending" },
  { id: "TRX-8918", name: "Sarah Wanjiku", vehicle: "Honda Fit", amount: "KSh 30,000", method: "Bank", icon: Banknote, date: "Yesterday", status: "Completed" },
];

const RECENT_ACTIVITIES = [
  { id: 1, title: "M-PESA payment received", desc: "KSh 15,000 from John Doe", time: "10 mins ago", icon: Banknote, color: "text-emerald-500" },
  { id: 2, title: "Car returned", desc: "Toyota Axio (KDH 999X) returned", time: "1 hour ago", icon: CheckCircle2, color: "text-blue-500" },
  { id: 3, title: "Maintenance Alert", desc: "Nissan Note due for oil change", time: "3 hours ago", icon: Wrench, color: "text-amber-500" },
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

export default function DealerDashboard() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-6 pb-10"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here is what's happening with your fleet today.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-500/20">
          <Download className="w-4 h-4" /> Download Report
        </button>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STATS.map((stat, idx) => (
          <div key={idx} className="p-5 rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">{stat.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${stat.bg} ${stat.color}`}>
                {stat.trend}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">vs last week</span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Middle Row: Revenue Chart & Fleet Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Revenue Trend */}
        <motion.div variants={itemVariants} className="lg:col-span-2 p-6 rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Revenue Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total earnings over the last 7 days</p>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">KSh 321,000</h3>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 h-40 mt-auto">
            {WEEKLY_REVENUE.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-full group">
                {/* Tooltip visible on hover */}
                <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.amount}
                </span>
                <div className="w-full max-w-[40px] bg-slate-100 dark:bg-slate-800 rounded-t-lg relative overflow-hidden h-full flex items-end">
                  <div 
                    className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000 ease-out group-hover:bg-blue-400"
                    style={{ height: data.height }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{data.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Fleet Utilization */}
        <motion.div variants={itemVariants} className="p-6 rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Fleet Status</h3>
              <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
            </div>
            
            {/* Donut Chart Placeholder / Visual Bar */}
            <div className="w-full h-8 rounded-xl flex overflow-hidden mb-6 bg-slate-100 dark:bg-slate-800">
              <div className="bg-emerald-500 h-full" style={{ width: '65%' }} title="Rented (65%)"></div>
              <div className="bg-blue-500 h-full" style={{ width: '25%' }} title="Available (25%)"></div>
              <div className="bg-rose-500 h-full" style={{ width: '10%' }} title="Maintenance (10%)"></div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Rented Out</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">26</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Available</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">10</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Maintenance</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">4</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Recent Payments Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Payments Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2 rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Payments</h3>
            <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80">
                  <th className="px-6 py-4 font-semibold">Transaction</th>
                  <th className="px-6 py-4 font-semibold">Client & Vehicle</th>
                  <th className="px-6 py-4 font-semibold">Amount & Method</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {RECENT_PAYMENTS.map((payment, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">{payment.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{payment.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-300">{payment.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{payment.vehicle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{payment.amount}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <payment.icon className="w-3.5 h-3.5" />
                        <span>{payment.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        payment.status === 'Completed' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <MoreHorizontal className="w-5 h-5 ml-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 text-center">
            <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              View All Transactions
            </button>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={itemVariants} className="p-6 rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Activity</h3>
          </div>
          <div className="space-y-6 flex-1">
            {RECENT_ACTIVITIES.map((activity, index) => (
              <div key={activity.id} className="flex gap-4 relative">
                {index !== RECENT_ACTIVITIES.length - 1 && (
                  <span className="absolute left-4 top-10 bottom-[-24px] w-px bg-slate-200 dark:bg-slate-800"></span>
                )}
                
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#0B1120] border-slate-100 dark:border-slate-800 z-10 ${activity.color}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activity.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{activity.desc}</p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            View All Activity
          </button>
        </motion.div>

      </div>
    </motion.div>
  );
}