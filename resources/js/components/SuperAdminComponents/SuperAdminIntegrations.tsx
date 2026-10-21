import { type Variants, motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, Clock, CreditCard, Database, HardDrive, Landmark, Mail, MapPin, MessageSquare, Navigation, PlugZap, RefreshCw, Smartphone, XCircle,
} from "lucide-react";
import LoadState from "../LoadState";
import { useApi } from "@/lib/useApi";

interface Integration {
  id: string;
  name: string;
  category: string;
  status: "connected" | "configured" | "attention" | "not_connected" | "error";
  detail: string;
  latency_ms: number | null;
}

const ICONS: Record<string, typeof Database> = {
  database: Database, storage: HardDrive, scheduler: Clock, mail: Mail, maps: MapPin,
  mpesa: Smartphone, card: CreditCard, sms: MessageSquare, etims: Landmark, gps: Navigation,
};
const STATUS: Record<Integration["status"], { label: string; style: string; icon: typeof CheckCircle2 }> = {
  connected: { label: "Healthy", style: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", icon: CheckCircle2 },
  configured: { label: "Configured", style: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", icon: CheckCircle2 },
  attention: { label: "Needs attention", style: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", icon: AlertCircle },
  not_connected: { label: "Not connected", style: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", icon: PlugZap },
  error: { label: "Error", style: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400", icon: XCircle },
};

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminIntegrations() {
  const { data, loading, error, reload } = useApi<{ data: Integration[] }>("/api/admin/integrations");
  const rows = data?.data ?? [];
  const groups = [
    { title: "Running the platform", sub: "Checked live each time this page loads", items: rows.filter((r) => ["database", "storage", "scheduler", "mail", "maps"].includes(r.id)) },
    { title: "Third-party services", sub: "Not built yet. Staff record these by hand for now", items: rows.filter((r) => !["database", "storage", "scheduler", "mail", "maps"].includes(r.id)) },
  ];

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Integrations</h2>
          <p className="text-sm text-slate-500 mt-1">What DriveFleet is actually connected to, and what still needs building.</p>
        </div>
        <button onClick={reload} className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Re-check
        </button>
      </motion.div>

      <LoadState loading={loading && !data} error={error} onRetry={reload}>
        {groups.map((g) => (
          <motion.section key={g.title} variants={itemVariants} className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{g.title}</h3>
              <p className="text-xs text-slate-500">{g.sub}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {g.items.map((i) => {
                const Icon = ICONS[i.id] ?? PlugZap;
                const s = STATUS[i.status];
                return (
                  <div key={i.id} className="p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm flex gap-4">
                    <div className={`p-3 h-fit rounded-2xl ${s.style}`}><Icon className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white">{i.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{i.category}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${s.style}`}>
                          <s.icon className="w-3 h-3" /> {s.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{i.detail}</p>
                      {i.latency_ms !== null && <p className="text-[10px] font-mono text-slate-400 mt-1">Responded in {i.latency_ms} ms</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        ))}
      </LoadState>
    </motion.div>
  );
}
