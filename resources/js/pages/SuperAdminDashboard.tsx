import { useApi } from "@/lib/useApi";
import { ksh, longDate } from "@/lib/format";
import { Link } from "react-router-dom";
import type { Stats } from "@/types/models";
import { type Variants, motion } from "framer-motion";
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
  CheckCircle2
} from "lucide-react";
import { Table, Td, Tr } from "../components/Card";

interface Overview {
  top_dealers: { id: number; name: string; city: string | null; gross: number; payments: number; percentage: number }[];
  attention: { type: "error" | "warning" | "info"; msg: string; link: string | null }[];
  recent_dealers: { id: number; reference: string; name: string; plan: string | null; joined: string; vehicles: number; status: string }[];
}

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SuperAdminDashboard() {
  const { data: stats } = useApi<Stats>("/api/stats");
  const { data: overview } = useApi<Overview>("/api/admin/overview");
  const GLOBAL_STATS = [
    { label: "Total Dealerships", value: stats?.platform ? String(stats.platform.dealers) : "—", icon: Building2, trend: "on the platform", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
    { label: "Global Fleet Size", value: stats?.vehicles ? stats.vehicles.total.toLocaleString() : "—", icon: CarFront, trend: stats?.vehicles ? `${stats.vehicles.rented} out now` : "…", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
    { label: "Customers", value: stats?.platform ? stats.platform.customers.toLocaleString() : "—", icon: Users, trend: stats ? `${stats.bookings.active} on a trip` : "…", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/10" },
    { label: "Booked (MTD)", value: stats ? ksh(stats.revenue.month_to_date) : "—", icon: Banknote, trend: stats ? `${ksh(stats.revenue.booked_today)} today` : "…", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10" },
  ];
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
          <Link to="/superadmin-system" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
            <Settings className="w-4 h-4" /> Global Settings
          </Link>
          <Link to="/superadmin-dealers" className="flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-500 dark:hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5">
            <Plus className="w-4 h-4" /> Onboard Dealer
          </Link>
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
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Payments received this month</p>
            </div>
            <Link to="/superadmin-reports" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">View Full Report</Link>
          </div>

          <div className="space-y-5 flex-1 relative z-10">
            {overview && overview.top_dealers.length === 0 && <p className="text-sm text-slate-400">No payments received yet this month.</p>}
            {(overview?.top_dealers ?? []).map((dealer, idx) => (
              <div key={dealer.id} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500 dark:text-slate-400 shrink-0">
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-1.5">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{dealer.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">{dealer.city} · {dealer.payments} payment{dealer.payments === 1 ? "" : "s"}</p>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{ksh(dealer.gross)}</span>
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

        {/* Needs attention */}
        <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-3xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Needs Attention
            </h3>
            <Link to="/superadmin-integrations" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">System status</Link>
          </div>
          <div className="space-y-3 flex-1">
            {overview && overview.attention.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-4 h-4" /> All clear.</p>
            )}
            {(overview?.attention ?? []).map((alert) => (
              <div key={alert.msg} className="flex gap-3 items-start">
                <ShieldAlert className={`w-4 h-4 mt-0.5 shrink-0 ${alert.type === "error" ? "text-rose-500" : alert.type === "warning" ? "text-amber-500" : "text-blue-500"}`} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">{alert.msg}</p>
                  {alert.link && <Link to={alert.link} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Open</Link>}
                </div>
              </div>
            ))}
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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Most recently onboarded dealerships.</p>
          </div>
          <Link to="/superadmin-subscriptions" className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors">
            Manage Plans
          </Link>
        </div>
        
        {/* Utilizing your custom responsive table */}
        <Table heads={["Dealer ID", "Dealership Info", "Subscription Plan", "Fleet Size", "Status"]}>
          {(overview?.recent_dealers ?? []).map((dealer) => (
            <Tr key={dealer.id}>
              <Td label="Dealer ID" className="font-bold text-slate-900 dark:text-slate-200">
                {dealer.reference}
              </Td>
              <Td label="Dealership Info">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">{dealer.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Joined: {longDate(dealer.joined)}</span>
              </Td>
              <Td label="Subscription Plan" className="font-medium text-slate-600 dark:text-slate-400">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                  dealer.plan === 'Enterprise' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' : 
                  dealer.plan === 'Business' ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' : 
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  {dealer.plan ?? "No plan"}
                </span>
              </Td>
              <Td label="Fleet Size" className="font-bold text-slate-900 dark:text-slate-200">
                {dealer.vehicles} Vehicle{dealer.vehicles === 1 ? "" : "s"}
              </Td>
              <Td label="Status" className="sm:text-left">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  dealer.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                  dealer.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                  'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                }`}>
                  {dealer.status}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 flex justify-center">
          <Link to="/superadmin-dealers" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
            View All Dealerships <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

    </motion.div>
  );
}