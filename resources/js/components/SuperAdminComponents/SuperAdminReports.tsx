import { useState, type ReactNode } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart3, Building2, CalendarDays, Car, Download, Filter, MapPin, ShieldCheck, Star, TrendingDown, TrendingUp, Users, Wallet, Bell,
} from "lucide-react";
import LoadState from "../LoadState";
import { useApi } from "@/lib/useApi";
import { downloadCsv } from "@/lib/csv";
import { PAYMENT_LABEL, ksh } from "@/lib/format";
import type { ReceivedMethod } from "@/types/models";

// ─── Data ─────────────────────────────────────────────────────────────────────
interface ReportData {
  period: string;
  from: string;
  kpis: {
    grossRevenue: number; revenueGrowth: number | null; netCommission: number; commGrowth: number | null; commissionShare: number | null;
    bookings: number; bookingsGrowth: number | null; avgRental: number; cancellations: number;
    users: number; newUsers: number; usersGrowth: number | null; vehicles: number; utilization: number; rating: number | null; ratingCount: number;
  };
  series: { label: string; gross: number; net: number; payouts: number; refunds: number; bookings: number; signups: number; bookers: number; returning: number }[];
  vehicleTypes: { type: string; count: number; pct: number; revenue: number; utilization: number }[];
  fleet: { total: number; rented: number; available: number; maintenance: number; suspended_dealer: number };
  topDealers: { id: string; name: string; location: string | null; status: string; gross: number; rentals: number; rating: number | null; utilization: number; fleet: number; growth: number | null }[];
  geoRevenue: { county: string; revenue: number; bookings: number; share: number }[];
  paymentMethods: { method: string; amount: number; pct: number }[];
  bookingsByDay: { day: string; count: number }[];
  funnel: { stage: string; count: number }[];
  kyc: { verified: number; pending: number; rejected: number };
  alerts: { type: "error" | "warning" | "info" | "success"; msg: string; link: string | null }[];
}

const PERIODS = [
  { id: "7d", label: "Last 7 Days" }, { id: "30d", label: "Last 30 Days" }, { id: "6m", label: "Last 6 Months" },
  { id: "ytd", label: "Year to Date" }, { id: "all", label: "All Time" },
];
const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#94a3b8"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`);
const kshShort = (n: number) => `KSh ${short(n)}`;
const methodLabel = (m: string) => PAYMENT_LABEL[m as ReceivedMethod] ?? m;
const fade: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const Card = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm ${className}`}>{children}</div>
);
const SectionTitle = ({ icon: Icon, title, sub, action }: { icon: typeof Users; title: ReactNode; sub?: ReactNode; action?: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><Icon className="w-4 h-4" /></div>
      <div>
        <h3 className="font-black text-slate-900 dark:text-slate-100">{title}</h3>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
    {action}
  </div>
);
const Delta = ({ value }: { value: number | null }) => {
  if (value === null) return <span className="text-[10px] font-bold text-slate-400">no earlier data</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-black ${up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{up ? "+" : ""}{value}%
    </span>
  );
};
const HBar = ({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) => (
  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
    <motion.div initial={{ width: 0 }} animate={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${color}`} />
  </div>
);
const Empty = ({ children = "No activity in this period." }: { children?: ReactNode }) => <p className="py-10 text-center text-sm text-slate-400">{children}</p>;

// ─── Charts ───────────────────────────────────────────────────────────────────
const Sparkline = ({ values, color }: { values: number[]; color: string }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 60},${18 - ((v - min) / (max - min || 1)) * 16}`).join(" ");
  return <svg width="64" height="20" viewBox="0 0 60 20" aria-hidden><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

const AreaChart = ({ data, height = 160 }: { data: ReportData["series"]; height?: number }) => {
  const max = Math.max(1, ...data.map((d) => d.gross));
  const x = (i: number) => (data.length > 1 ? (i / (data.length - 1)) * 100 : 50);
  const line = (key: "gross" | "net") => data.map((d, i) => `${x(i)},${100 - (d[key] / max) * 90}`).join(" ");
  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" aria-label="Revenue trend">
        <defs>
          <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.25" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.02" /></linearGradient>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" /></linearGradient>
        </defs>
        <polyline points={`0,100 ${line("gross")} 100,100`} fill="url(#grossGrad)" stroke="none" />
        <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} points={line("gross")} fill="none" stroke="#10b981" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        <polyline points={`0,100 ${line("net")} 100,100`} fill="url(#netGrad)" stroke="none" />
        <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.3 }} points={line("net")} fill="none" stroke="#f59e0b" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {data.map((d) => <span key={d.label} className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{d.label}</span>)}
      </div>
    </div>
  );
};

const StackedBars = ({ data, height = 180 }: { data: ReportData["series"]; height?: number }) => {
  const max = Math.max(1, ...data.map((d) => d.signups + d.returning));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} title={`${d.label}: ${d.signups} new sign-ups · ${d.returning} returning bookers`} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end rounded-t-lg overflow-hidden" style={{ height: height - 16 }}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${(d.signups / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} className="w-full bg-blue-500" />
            <motion.div initial={{ height: 0 }} animate={{ height: `${(d.returning / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05 + 0.1 }} className="w-full bg-slate-300 dark:bg-slate-600" />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const Donut = ({ segments, size = 130 }: { segments: { pct: number; color: string; label: string }[]; size?: number }) => {
  const r = 42, circ = 2 * Math.PI * r;
  const offsets = segments.reduce<number[]>((acc, s, i) => [...acc, (acc[i - 1] ?? 0) + (i === 0 ? 0 : segments[i - 1].pct)], []);
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <circle cx={60} cy={60} r={r} fill="none" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-slate-800" />
      {segments.map((s, i) => (
        <motion.circle key={s.label} cx={60} cy={60} r={r} fill="none" stroke={s.color} strokeWidth="16" transform="rotate(-90 60 60)"
          strokeDashoffset={circ - (offsets[i] / 100) * circ} initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${(s.pct / 100) * circ} ${circ}` }} transition={{ duration: 0.8, delay: i * 0.15 }} />
      ))}
      <text x="60" y="58" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200" fontSize="14" fontWeight="900">{segments[0] ? `${Math.round(segments[0].pct)}%` : "—"}</text>
      <text x="60" y="70" textAnchor="middle" className="fill-slate-400" fontSize="7" fontWeight="700">{segments[0]?.label ?? ""}</text>
    </svg>
  );
};

const Funnel = ({ stages }: { stages: ReportData["funnel"] }) => {
  const top = Math.max(1, stages[0]?.count ?? 0);
  const colors = ["bg-blue-500", "bg-blue-400", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const pct = Math.round((s.count / top) * 100);
        const prev = stages[i - 1]?.count;
        return (
          <div key={s.stage} className="flex items-center gap-3">
            <div className="w-32 flex-shrink-0"><p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{s.stage}</p><p className="text-[10px] text-slate-400">{s.count.toLocaleString()}</p></div>
            <div className="flex-1 h-6 flex items-center">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 4)}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className={`h-5 rounded-md ${colors[i]} flex items-center justify-end pr-2`}>
                <span className="text-[10px] font-black text-white">{pct}%</span>
              </motion.div>
            </div>
            <span className="w-12 text-right text-[10px] font-bold text-rose-500">{prev ? `-${Math.round(((prev - s.count) / prev) * 100)}%` : ""}</span>
          </div>
        );
      })}
    </div>
  );
};

const ALERT_STYLE: Record<ReportData["alerts"][number]["type"], string> = {
  error: "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400",
  warning: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400",
  info: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400",
  success: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SuperAdminReports() {
  const [period, setPeriod] = useState("6m");
  const [tab, setTab] = useState("overview");
  const { data: d, loading, error, reload } = useApi<ReportData>(`/api/admin/reports?period=${period}`);
  const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? period;

  const exportCsv = () => {
    if (!d) return;
    downloadCsv(`drivefleet-report-${period}.csv`,
      ["Period", "Gross (KSh)", "Commission (KSh)", "Payouts sent (KSh)", "Refunds (KSh)", "Bookings", "New customers", "Customers who booked", "Returning bookers"],
      d.series.map((s) => [s.label, s.gross, s.net, s.payouts, s.refunds, s.bookings, s.signups, s.bookers, s.returning]));
  };

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 }, { id: "revenue", label: "Revenue", icon: Wallet }, { id: "users", label: "Customers", icon: Users },
    { id: "fleet", label: "Fleet", icon: Car }, { id: "dealers", label: "Dealers", icon: Building2 }, { id: "geography", label: "Geography", icon: MapPin },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Platform Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">From completed payments, bookings and accounts. Growth compares with the previous period of the same length.</p>
        </div>
        <div className="flex items-center gap-3">
          <select aria-label="Period" value={period} onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 text-sm font-bold">
            {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button onClick={exportCsv} disabled={!d} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </motion.div>

      {!d ? <LoadState loading={loading} error={error} onRetry={reload} /> : (
        <>
          <motion.div variants={fade} className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
            {[
              { label: "Gross Revenue", value: kshShort(d.kpis.grossRevenue), delta: d.kpis.revenueGrowth, sub: "completed payments, incl. VAT", spark: d.series.map((s) => s.gross), color: "#10b981", icon: Wallet, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
              { label: "Platform Commission", value: kshShort(d.kpis.netCommission), delta: d.kpis.commGrowth, sub: d.kpis.commissionShare !== null ? `${d.kpis.commissionShare}% of gross` : "", spark: d.series.map((s) => s.net), color: "#3b82f6", icon: BarChart3, tone: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
              { label: "Bookings", value: d.kpis.bookings.toLocaleString(), delta: d.kpis.bookingsGrowth, sub: `${d.kpis.avgRental} day average`, spark: d.series.map((s) => s.bookings), color: "#8b5cf6", icon: CalendarDays, tone: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" },
              { label: "Customers", value: d.kpis.users.toLocaleString(), delta: d.kpis.usersGrowth, sub: `${d.kpis.newUsers} joined this period`, spark: d.series.map((s) => s.signups), color: "#f59e0b", icon: Users, tone: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
            ].map(({ label, value, delta, sub, spark, color, icon: Icon, tone }) => (
              <Card key={label} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${tone} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
                  <Sparkline values={spark} color={color} />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap"><Delta value={delta} /><span className="text-[10px] text-slate-400">{sub}</span></div>
              </Card>
            ))}
          </motion.div>

          <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Fleet Utilization", value: `${d.kpis.utilization}%`, color: "text-blue-600 dark:text-blue-400", icon: Car },
              { label: "Cancellation Rate", value: `${d.kpis.cancellations}%`, color: "text-rose-600 dark:text-rose-400", icon: Filter },
              { label: "Avg Rental", value: `${d.kpis.avgRental} days`, color: "text-violet-600 dark:text-violet-400", icon: CalendarDays },
              { label: `Avg Rating (${d.kpis.ratingCount})`, value: d.kpis.rating !== null ? `${d.kpis.rating} / 5` : "—", color: "text-emerald-600 dark:text-emerald-400", icon: Star },
            ].map(({ label, value, color, icon: Icon }) => (
              <Card key={label} className="p-4 flex items-center gap-3">
                <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div><p className={`text-xl font-black ${color} leading-none`}>{value}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p></div>
              </Card>
            ))}
          </motion.div>

          <motion.div variants={fade} className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap ${tab === t.id ? "text-blue-600 border-b-2 border-blue-600 -mb-px" : "text-slate-500 dark:text-slate-400"}`}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div key="ov" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <SectionTitle icon={Wallet} title="Revenue Trend" sub={`Gross vs commission · ${periodLabel}`}
                      action={<div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase"><span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-emerald-500" />Gross</span><span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-amber-400" />Commission</span></div>} />
                    <AreaChart data={d.series} />
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[["Gross", d.series.reduce((s, r) => s + r.gross, 0)], ["Commission", d.series.reduce((s, r) => s + r.net, 0)], ["Payouts sent", d.series.reduce((s, r) => s + r.payouts, 0)]].map(([l, v]) => (
                        <div key={l} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center"><p className="text-xs font-black text-slate-900 dark:text-slate-100">{kshShort(v as number)}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{l}</p></div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-6">
                    <SectionTitle icon={Users} title="Customer Acquisition" sub="New sign-ups vs returning bookers"
                      action={<div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase"><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500" />New</span><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" />Returning</span></div>} />
                    <StackedBars data={d.series} />
                  </Card>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <SectionTitle icon={CalendarDays} title="Pickups by Day of Week" sub={periodLabel} />
                    {d.bookingsByDay.every((b) => b.count === 0) ? <Empty /> : (() => {
                      const max = Math.max(...d.bookingsByDay.map((b) => b.count));
                      const peak = d.bookingsByDay.find((b) => b.count === max);
                      return (
                        <>
                          <div className="flex gap-2">
                            {d.bookingsByDay.map((b) => (
                              <div key={b.day} title={`${b.day}: ${b.count} pickups`} className="flex-1 flex flex-col items-center gap-1.5">
                                <div className="w-full h-14 rounded-lg border border-blue-500/20" style={{ backgroundColor: `rgba(59,130,246,${Math.max(0.08, b.count / max)})` }} />
                                <span className="text-[9px] font-black text-slate-400 uppercase">{b.day}</span>
                                <span className="text-[9px] font-black text-slate-700 dark:text-slate-300">{b.count}</span>
                              </div>
                            ))}
                          </div>
                          <p className="mt-4 text-xs text-slate-400">Busiest: <strong className="text-slate-700 dark:text-slate-300">{peak?.day} ({max})</strong></p>
                        </>
                      );
                    })()}
                  </Card>
                  <Card className="p-6">
                    <SectionTitle icon={Bell} title="Needs Attention" sub="Right now, across the platform" />
                    {d.alerts.length === 0 ? <Empty>Nothing needs attention.</Empty> : (
                      <div className="space-y-2.5">
                        {d.alerts.map((a) => (
                          <div key={a.msg} className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs font-semibold ${ALERT_STYLE[a.type]}`}>
                            <span>{a.msg}</span>
                            {a.link && <Link to={a.link} className="shrink-0 underline">Open</Link>}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </motion.div>
            )}

            {tab === "revenue" && (
              <motion.div key="rev" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                  <SectionTitle icon={Wallet} title="Revenue Breakdown" sub="Gross · commission · payouts sent · refunds" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 dark:border-slate-800">{["Period", "Gross", "Commission", "Payouts sent", "Refunds", "Take rate"].map((h) => <th key={h} className="pb-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                      <tbody>
                        {d.series.map((r) => (
                          <tr key={r.label} className="border-b border-slate-50 dark:border-slate-800/50">
                            <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{r.label}</td>
                            <td className="py-3 font-black text-emerald-600 dark:text-emerald-400">{ksh(r.gross)}</td>
                            <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{ksh(r.net)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-400">{ksh(r.payouts)}</td>
                            <td className="py-3 text-rose-500">{ksh(r.refunds)}</td>
                            <td className="py-3 text-xs font-black text-slate-500">{r.gross ? `${((r.net / r.gross) * 100).toFixed(1)}%` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Commission is charged on the pre-VAT amount, so it shows as a smaller share of gross (which includes VAT).</p>
                </Card>
                <Card className="p-6">
                  <SectionTitle icon={Wallet} title="Payment Methods" sub="Share of gross" />
                  {d.paymentMethods.length === 0 ? <Empty /> : (
                    <>
                      <div className="flex justify-center mb-4"><Donut segments={d.paymentMethods.map((p, i) => ({ pct: p.pct, label: methodLabel(p.method), color: PALETTE[i % PALETTE.length] }))} /></div>
                      <div className="space-y-2.5">
                        {d.paymentMethods.map((p, i) => (
                          <div key={p.method} className="flex items-center gap-3 text-sm">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                            <span className="flex-1 font-semibold text-slate-700 dark:text-slate-300">{methodLabel(p.method)}</span>
                            <span className="text-xs text-slate-400">{kshShort(p.amount)}</span>
                            <span className="w-12 text-right text-xs font-black text-slate-900 dark:text-slate-100">{p.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            )}

            {tab === "users" && (
              <motion.div key="usr" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6"><SectionTitle icon={Filter} title="Customer Funnel" sub="All customers, sign-up to repeat booking" /><Funnel stages={d.funnel} /></Card>
                  <Card className="p-6">
                    <SectionTitle icon={ShieldCheck} title="KYC Status" sub="Identity checks across all customers" />
                    {(() => {
                      const total = Math.max(1, d.kyc.verified + d.kyc.pending + d.kyc.rejected);
                      return (
                        <div className="space-y-5">
                          {([["Verified", d.kyc.verified, "bg-emerald-500"], ["Pending", d.kyc.pending, "bg-amber-400"], ["Rejected", d.kyc.rejected, "bg-rose-500"]] as const).map(([label, count, color]) => (
                            <div key={label}>
                              <div className="flex justify-between mb-1.5 text-sm"><span className="font-bold text-slate-700 dark:text-slate-300">{label}</span><span className="font-black text-slate-900 dark:text-slate-100">{count} · {Math.round((count / total) * 100)}%</span></div>
                              <HBar value={count} max={total} color={color} />
                            </div>
                          ))}
                          {d.kyc.pending > 0 && <Link to="/superadmin-clients" className="block p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 text-xs font-bold text-amber-700 dark:text-amber-400">{d.kyc.pending} customer{d.kyc.pending === 1 ? "" : "s"} waiting for review → Clients</Link>}
                        </div>
                      );
                    })()}
                  </Card>
                </div>
                <Card className="p-6">
                  <SectionTitle icon={Users} title="Customers by Period" sub="Sign-ups, customers who booked, and how many had booked before" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 dark:border-slate-800">{["Period", "New sign-ups", "Booked", "Returning", "Repeat share"].map((h) => <th key={h} className="pb-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                      <tbody>
                        {d.series.map((u) => (
                          <tr key={u.label} className="border-b border-slate-50 dark:border-slate-800/50">
                            <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{u.label}</td>
                            <td className="py-3 font-bold text-blue-600 dark:text-blue-400">+{u.signups}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-400">{u.bookers}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-400">{u.returning}</td>
                            <td className="py-3 text-xs font-black text-slate-500">{u.bookers ? `${Math.round((u.returning / u.bookers) * 100)}%` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {tab === "fleet" && (
              <motion.div key="flt" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <SectionTitle icon={Car} title="Fleet by Vehicle Type" sub={`Share of listings, revenue and utilization · ${periodLabel}`} />
                  {d.vehicleTypes.length === 0 ? <Empty>No vehicles listed.</Empty> : (
                    <div className="space-y-5">
                      {d.vehicleTypes.map((v) => (
                        <div key={v.type}>
                          <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{v.type} <span className="ml-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{v.count} · {v.pct}%</span></span>
                            <span className="text-xs text-slate-400">{kshShort(v.revenue)} · <span className="font-black text-slate-700 dark:text-slate-300">{v.utilization}% used</span></span>
                          </div>
                          <HBar value={v.utilization} max={100} color={v.utilization >= 70 ? "bg-emerald-500" : v.utilization >= 40 ? "bg-amber-400" : "bg-rose-500"} />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                <Card className="p-6">
                  <SectionTitle icon={BarChart3} title="Fleet Right Now" sub="Current vehicle statuses" />
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Listed", d.fleet.total, "text-slate-900 dark:text-slate-100"], ["On a rental", d.fleet.rented, "text-emerald-600 dark:text-emerald-400"],
                      ["Available", d.fleet.available, "text-blue-600 dark:text-blue-400"], ["In maintenance", d.fleet.maintenance, "text-amber-600 dark:text-amber-400"],
                      ["At suspended dealers", d.fleet.suspended_dealer, "text-rose-600 dark:text-rose-400"], [`Utilization (${periodLabel})`, `${d.kpis.utilization}%`, "text-violet-600 dark:text-violet-400"],
                    ].map(([label, value, color]) => (
                      <div key={label as string} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <p className={`text-xl font-black ${color}`}>{value}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-4">Utilization is the share of vehicle-days in the period that were out on a booking.</p>
                </Card>
              </motion.div>
            )}

            {tab === "dealers" && (
              <motion.div key="dlr" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                <Card className="overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800"><SectionTitle icon={Building2} title="Dealer Leaderboard" sub={`Ranked by gross revenue · ${periodLabel}`} /></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">{["Rank", "Dealer", "Fleet", "Utilization", "Rentals", "Gross", "Growth", "Rating"].map((h) => <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                      <tbody>
                        {d.topDealers.map((dl, i) => (
                          <tr key={dl.id} className="border-b border-slate-50 dark:border-slate-800/60">
                            <td className="px-5 py-4"><span className={`w-8 h-8 rounded-lg inline-flex items-center justify-center font-black ${i === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>#{i + 1}</span></td>
                            <td className="px-5 py-4"><p className="font-bold text-slate-900 dark:text-slate-100">{dl.name}</p><p className="text-[10px] text-slate-400">{dl.location} · {dl.id}{dl.status !== "active" && ` · ${dl.status}`}</p></td>
                            <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">{dl.fleet}</td>
                            <td className="px-5 py-4 min-w-[120px]"><div className="flex items-center gap-2"><HBar value={dl.utilization} max={100} color={dl.utilization >= 70 ? "bg-emerald-500" : dl.utilization >= 40 ? "bg-amber-400" : "bg-rose-500"} /><span className="text-xs font-black text-slate-700 dark:text-slate-300">{dl.utilization}%</span></div></td>
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{dl.rentals}</td>
                            <td className="px-5 py-4 font-black text-emerald-600 dark:text-emerald-400">{ksh(dl.gross)}</td>
                            <td className="px-5 py-4"><Delta value={dl.growth} /></td>
                            <td className="px-5 py-4 font-black text-slate-700 dark:text-slate-300">{dl.rating !== null ? <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-current" />{dl.rating}</span> : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {tab === "geography" && (
              <motion.div key="geo" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <SectionTitle icon={MapPin} title="Revenue by County" sub={`By dealer location · ${periodLabel}`} />
                  {d.geoRevenue.every((g) => g.revenue === 0) ? <Empty /> : (
                    <div className="space-y-4">
                      {d.geoRevenue.map((g, i) => (
                        <div key={g.county}>
                          <div className="flex items-center justify-between mb-1.5 text-sm">
                            <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{g.county}</span>
                            <span className="text-xs text-slate-400">{g.bookings} bookings · <span className="font-black text-slate-700 dark:text-slate-200">{kshShort(g.revenue)}</span> · {g.share}%</span>
                          </div>
                          <HBar value={g.share} max={100} color="bg-blue-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                <Card className="p-6 flex flex-col items-center">
                  <SectionTitle icon={MapPin} title="Geographic Share" sub="Share of gross revenue" />
                  {d.geoRevenue.every((g) => g.revenue === 0) ? <Empty /> : <Donut size={170} segments={d.geoRevenue.filter((g) => g.share > 0).map((g, i) => ({ pct: g.share, label: g.county, color: PALETTE[i % PALETTE.length] }))} />}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
