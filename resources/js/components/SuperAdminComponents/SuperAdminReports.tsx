import { useState, type ReactNode, type SVGProps } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";

// ─── Inline SVG Icon ──────────────────────────────────────────────────────────
type IconPath = string | SVGProps<SVGCircleElement> | (string | SVGProps<SVGCircleElement>)[];

const Icon = ({ d, size = 18, strokeWidth = 1.8, className = "", fill = "none" }: { d: IconPath; size?: number; strokeWidth?: number; className?: string; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {(Array.isArray(d) ? d : [d]).map((p, i) =>
      typeof p === "object" ? <circle key={i} {...p} /> : <path key={i} d={p} />
    )}
  </svg>
);

// ─── DATA LAYER ───────────────────────────────────────────────────────────────
const PERIODS = ["Last 7 Days", "Last 30 Days", "Last 6 Months", "Year to Date", "All Time"];

const BASE_DATA = {
  "Last 6 Months": {
    kpis: { users: 12480, usersGrowth: 18.4, vehicles: 854, vehiclesGrowth: 11.2, grossRevenue: 32400000, revenueGrowth: 24.7, netCommission: 3240000, commGrowth: 24.7, bookings: 4821, bookingsGrowth: 15.3, avgRental: 4.2, utilization: 76.4, cancellations: 3.8, nps: 71 },
    userGrowth: [
      { label: "Jan", new: 820, returning: 1240, churned: 90 },
      { label: "Feb", new: 940, returning: 1380, churned: 105 },
      { label: "Mar", new: 880, returning: 1290, churned: 88 },
      { label: "Apr", new: 1120, returning: 1540, churned: 112 },
      { label: "May", new: 1340, returning: 1720, churned: 134 },
      { label: "Jun", new: 1580, returning: 2010, churned: 158 },
    ],
    revenue: [
      { label: "Jan", gross: 4.2, net: 0.42, payouts: 3.78, refunds: 0.12 },
      { label: "Feb", gross: 5.1, net: 0.51, payouts: 4.59, refunds: 0.09 },
      { label: "Mar", gross: 4.8, net: 0.48, payouts: 4.32, refunds: 0.15 },
      { label: "Apr", gross: 6.5, net: 0.65, payouts: 5.85, refunds: 0.08 },
      { label: "May", gross: 7.2, net: 0.72, payouts: 6.48, refunds: 0.11 },
      { label: "Jun", gross: 8.9, net: 0.89, payouts: 8.01, refunds: 0.07 },
    ],
    vehicleTypes: [
      { type: "SUVs", count: 312, pct: 36.5, revenue: 14.2, utilization: 81 },
      { type: "Sedans", count: 248, pct: 29.0, revenue: 9.8, utilization: 74 },
      { type: "Minivans", count: 142, pct: 16.6, revenue: 5.4, utilization: 70 },
      { type: "Pickups", count: 98, pct: 11.5, revenue: 3.1, utilization: 65 },
      { type: "Luxury", count: 54, pct: 6.3, revenue: 4.8, utilization: 88 },
    ],
    topDealers: [
      { id: "DLR-101", name: "Swift Car Hire", location: "Nairobi CBD", gross: 12500000, rentals: 842, rating: 4.9, utilization: 88, fleet: 85, growth: 22 },
      { id: "DLR-102", name: "Luxe Drive", location: "Westlands", gross: 9800000, rentals: 512, rating: 4.8, utilization: 84, fleet: 60, growth: 18 },
      { id: "DLR-103", name: "Premier Auto", location: "Mombasa", gross: 6500000, rentals: 320, rating: 4.6, utilization: 79, fleet: 142, growth: 31 },
      { id: "DLR-104", name: "City Movers", location: "Kilimani", gross: 4200000, rentals: 290, rating: 4.7, utilization: 72, fleet: 45, growth: 9 },
      { id: "DLR-105", name: "Rift Valley Motors", location: "Nakuru", gross: 1800000, rentals: 120, rating: 4.3, utilization: 58, fleet: 32, growth: -5 },
    ],
    geoRevenue: [
      { county: "Nairobi", revenue: 18.4, bookings: 2840, share: 56.8 },
      { county: "Mombasa", revenue: 7.2, bookings: 920, share: 22.2 },
      { county: "Kiambu", revenue: 3.1, bookings: 480, share: 9.6 },
      { county: "Nakuru", revenue: 2.0, bookings: 320, share: 6.2 },
      { county: "Others", revenue: 1.7, bookings: 261, share: 5.2 },
    ],
    paymentMethods: [
      { method: "M-Pesa", pct: 62, amount: 20.1 },
      { method: "Card", pct: 28, amount: 9.1 },
      { method: "Bank Transfer", pct: 8, amount: 2.6 },
      { method: "Cash", pct: 2, amount: 0.6 },
    ],
    bookingsByDay: [
      { day: "Mon", count: 142 }, { day: "Tue", count: 128 }, { day: "Wed", count: 134 },
      { day: "Thu", count: 156 }, { day: "Fri", count: 198 }, { day: "Sat", count: 221 }, { day: "Sun", count: 184 },
    ],
    kycFunnel: [
      { stage: "Registered", count: 12480 },
      { stage: "Submitted KYC", count: 9840 },
      { stage: "KYC Verified", count: 8210 },
      { stage: "First Booking", count: 5640 },
      { stage: "Repeat Booker", count: 3120 },
    ],
    recentAlerts: [
      { type: "warning", msg: "Fleet utilization dipped below 60% in Nakuru", time: "2h ago" },
      { type: "success", msg: "June revenue exceeded forecast by 14%", time: "1d ago" },
      { type: "error", msg: "3 KYC reviews pending > 72 hours", time: "1d ago" },
      { type: "info", msg: "Luxe Drive onboarded 12 new vehicles", time: "2d ago" },
    ],
  },
};
type ReportData = (typeof BASE_DATA)["Last 6 Months"];
const DATA: Record<string, ReportData> = BASE_DATA;
DATA["Last 7 Days"] = DATA["Last 6 Months"];
DATA["Last 30 Days"] = DATA["Last 6 Months"];
DATA["Year to Date"] = DATA["Last 6 Months"];
DATA["All Time"] = DATA["Last 6 Months"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n;
const fmtKES = (n: number) => `KSh ${fmt(n)}`;
const fade: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

const Card = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon, title, sub, action }: { icon?: IconPath; title: ReactNode; sub?: ReactNode; action?: ReactNode }) => (
  <div className="flex items-start justify-between mb-5">
    <div className="flex items-center gap-2.5">
      {icon && <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0"><Icon d={icon} size={15} /></div>}
      <div>
        <h3 className="font-black text-slate-900 dark:text-slate-100 text-base leading-none">{title}</h3>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
    {action}
  </div>
);

const Delta = ({ value, inverse = false }: { value: number; inverse?: boolean }) => {
  const pos = inverse ? value < 0 : value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-black ${pos ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
      <Icon d={pos ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} size={11} strokeWidth={2.5} />
      {Math.abs(value)}%
    </span>
  );
};

const Tooltip = ({ children, label }: { children?: ReactNode; label: ReactNode }) => (
  <div className="group relative">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
      {label}
    </div>
  </div>
);

// ─── CHART COMPONENTS ─────────────────────────────────────────────────────────

// Stacked Bar Chart
const StackedBarChart = ({ data, height = 180 }: { data: ReportData["userGrowth"]; height?: number }) => {
  const maxVal = Math.max(...data.map(d => d.new + d.returning));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const total = d.new + d.returning;
        const newH = (d.new / maxVal) * height;
        const retH = (d.returning / maxVal) * height;
        return (
          <Tooltip key={i} label={`${d.label}: ${d.new} new · ${d.returning} returning`}>
            <div className="flex-1 flex flex-col items-center gap-1 cursor-pointer">
              <div className="w-full flex flex-col justify-end rounded-t-lg overflow-hidden" style={{ height: newH + retH }}>
                <motion.div initial={{ height: 0 }} animate={{ height: newH }} transition={{ duration: 0.7, delay: i * 0.05 }}
                  className="w-full bg-blue-500 flex-shrink-0" style={{ minHeight: 0 }} />
                <motion.div initial={{ height: 0 }} animate={{ height: retH }} transition={{ duration: 0.7, delay: i * 0.05 + 0.1 }}
                  className="w-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" style={{ minHeight: 0 }} />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{d.label}</span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

// Line + Area Chart
const AreaChart = ({ data, height = 160 }: { data: ReportData["revenue"]; height?: number }) => {
  const maxVal = Math.max(...data.map(d => d.gross));
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.gross / maxVal) * 90;
    return `${x},${y}`;
  }).join(" ");
  const netPts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.net / maxVal) * 90;
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }}
          points={`0,100 ${pts} 100,100`} fill="url(#grossGrad)" stroke="none" vectorEffect="non-scaling-stroke" />
        <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.2 }}
          points={pts} fill="none" stroke="#10b981" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.4 }}
          points={`0,100 ${netPts} 100,100`} fill="url(#netGrad)" stroke="none" vectorEffect="non-scaling-stroke" />
        <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.4 }}
          points={netPts} fill="none" stroke="#f59e0b" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - (d.gross / maxVal) * 90;
          return <circle key={i} cx={x} cy={y} r="1.2" fill="#10b981" />;
        })}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {data.map((d, i) => <span key={i} className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{d.label}</span>)}
      </div>
    </div>
  );
};

// Horizontal Bar
const HBar = ({ value, max, color = "bg-blue-500", animate = true }: { value: number; max: number; color?: string; animate?: boolean }) => (
  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
    <motion.div initial={animate ? { width: 0 } : { width: `${(value / max) * 100}%` }}
      animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
      className={`h-full rounded-full ${color}`} />
  </div>
);

// Donut via SVG
const DonutChart = ({ segments, size = 120 }: { segments: { pct: number; color: string; label: string }[]; size?: number }) => {
  const r = 42; const cx = 60; const cy = 60; const circ = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" className="dark:stroke-slate-800" />
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circ;
        const offset = circ - cumulative * circ / 100;
        cumulative += seg.pct;
        return (
          <motion.circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="16"
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={offset}
            initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ duration: 0.8, delay: i * 0.15 }} transform="rotate(-90 60 60)" />
        );
      })}
      <text x="60" y="57" textAnchor="middle" className="fill-slate-700 dark:fill-slate-200" fontSize="14" fontWeight="900">
        {segments[0]?.pct}%
      </text>
      <text x="60" y="69" textAnchor="middle" className="fill-slate-400" fontSize="7" fontWeight="700">
        {segments[0]?.label}
      </text>
    </svg>
  );
};

// Funnel
const FunnelChart = ({ stages }: { stages: ReportData["kycFunnel"] }) => {
  const max = stages[0].count;
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const pct = Math.round((s.count / max) * 100);
        const drop = i > 0 ? Math.round(((stages[i - 1].count - s.count) / stages[i - 1].count) * 100) : null;
        const colors = ["bg-blue-500", "bg-blue-400", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-28 flex-shrink-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{s.stage}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.count.toLocaleString()}</p>
            </div>
            <div className="flex-1 relative h-6 flex items-center">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                className={`h-5 rounded-md ${colors[i]} flex items-center justify-end pr-2`}>
                <span className="text-[10px] font-black text-white">{pct}%</span>
              </motion.div>
            </div>
            {drop !== null && (
              <div className="w-16 flex-shrink-0 text-right">
                <span className="text-[10px] font-bold text-rose-500">-{drop}%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Sparkline
const Sparkline = ({ values, color = "#3b82f6" }: { values: number[]; color?: string }) => {
  const max = Math.max(...values); const min = Math.min(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 60;
    const y = 18 - ((v - min) / (max - min || 1)) * 16;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="64" height="20" viewBox="0 0 60 20">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Day heatmap
const BookingHeatmap = ({ data }: { data: ReportData["bookingsByDay"] }) => {
  const max = Math.max(...data.map(d => d.count));
  const opacity = (v: number) => Math.max(0.08, v / max);
  return (
    <div className="flex gap-2">
      {data.map(d => (
        <Tooltip key={d.day} label={`${d.day}: ${d.count} bookings`}>
          <div className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer">
            <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5 }}
              className="w-full rounded-lg" style={{ height: 56, backgroundColor: `rgba(59,130,246,${opacity(d.count)})`, border: "1px solid rgba(59,130,246,0.2)" }} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">{d.day}</span>
            <span className="text-[9px] font-black text-slate-700 dark:text-slate-300">{d.count}</span>
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

// Alert item
type AlertStyle = { bg: string; dot: string; text: string };

const AlertItem = ({ alert }: { alert: ReportData["recentAlerts"][number] }) => {
  const styles = ({
    warning: { bg: "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400" },
    success: { bg: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
    error:   { bg: "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-400" },
    info:    { bg: "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50", dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
  } as Record<string, AlertStyle>)[alert.type];
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${styles.bg}`}>
      <div className={`w-2 h-2 rounded-full ${styles.dot} mt-1.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${styles.text} leading-relaxed`}>{alert.msg}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{alert.time}</p>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SuperAdminReports() {
  const [period, setPeriod] = useState("Last 6 Months");
  const [activeTab, setActiveTab] = useState("overview");
  const d = DATA[period];

  const TABS = [
    { id: "overview",  label: "Overview",    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "revenue",   label: "Revenue",     icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id: "users",     label: "Users",       icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "fleet",     label: "Fleet",       icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM3 7h18M3 7l1-4h16l1 4M3 7v7a2 2 0 002 2h1M21 7v7a2 2 0 01-2 2h-1" },
    { id: "dealers",   label: "Dealers",     icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { id: "geography", label: "Geography",   icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">

      {/* ── Header ── */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Platform Analytics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Comprehensive reporting · Super Admin</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all">
            {PERIODS.map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/20">
            <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={15} />
            Export
          </button>
        </div>
      </motion.div>

      {/* ── Primary KPI Grid ── */}
      <motion.div variants={fade} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue",    value: fmtKES(d.kpis.grossRevenue), delta: d.kpis.revenueGrowth, sub: "vs prev period", spark: [4.2,5.1,4.8,6.5,7.2,8.9], color: "#10b981", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", accent: "emerald" },
          { label: "Net Commission",   value: fmtKES(d.kpis.netCommission), delta: d.kpis.commGrowth, sub: "10% of gross", spark: [0.42,0.51,0.48,0.65,0.72,0.89], color: "#3b82f6", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", accent: "blue" },
          { label: "Total Bookings",   value: d.kpis.bookings.toLocaleString(), delta: d.kpis.bookingsGrowth, sub: `${d.kpis.avgRental} day avg stay`, spark: [620,740,700,840,920,1001], color: "#8b5cf6", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", accent: "violet" },
          { label: "Registered Users", value: d.kpis.users.toLocaleString(), delta: d.kpis.usersGrowth, sub: `${d.kpis.vehicles} vehicles listed`, spark: [1800,2100,1950,2400,2800,3100], color: "#f59e0b", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", accent: "amber" },
        ].map(({ label, value, delta, sub, spark, color, icon, accent }) => {
          const bg = { emerald:"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", blue:"bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", violet:"bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400", amber:"bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" }[accent];
          return (
            <Card key={label} className="p-5 group hover:-translate-y-0.5 transition-transform">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><Icon d={icon} size={17} /></div>
                <Sparkline values={spark} color={color} />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{value}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{label}</p>
              <div className="flex items-center gap-2 mt-2">
                <Delta value={delta} />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</span>
              </div>
            </Card>
          );
        })}
      </motion.div>

      {/* ── Secondary KPIs ── */}
      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Fleet Utilization",    value: `${d.kpis.utilization}%`,   color: "text-blue-600 dark:text-blue-400",    icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" },
          { label: "Cancellation Rate",    value: `${d.kpis.cancellations}%`, color: "text-rose-600 dark:text-rose-400",     icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636" },
          { label: "Avg Rental Duration",  value: `${d.kpis.avgRental}d`,     color: "text-violet-600 dark:text-violet-400", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
          { label: "Net Promoter Score",   value: d.kpis.nps,                 color: "text-emerald-600 dark:text-emerald-400",icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
        ].map(({ label, value, color, icon }) => (
          <Card key={label} className="p-4 flex items-center gap-3">
            <Icon d={icon} size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <div>
              <p className={`text-xl font-black ${color} leading-none`}>{value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* ── Tab Navigation ── */}
      <motion.div variants={fade} className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === t.id ? "text-blue-600 border-b-2 border-blue-600 -mb-px" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            <Icon d={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ────────────── OVERVIEW TAB ────────────── */}
        {activeTab === "overview" && (
          <motion.div key="ov" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Revenue Area Chart */}
              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" title="Revenue Trend" sub={`Gross vs Net · ${period}`}
                    action={<div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" />Gross</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-amber-400 inline-block" />Net</span>
                    </div>} />
                  <AreaChart data={d.revenue} height={160} />
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Gross", value: `KSh ${d.revenue.reduce((s,r)=>s+r.gross,0).toFixed(1)}M` },
                      { label: "Total Net", value: `KSh ${d.revenue.reduce((s,r)=>s+r.net,0).toFixed(2)}M` },
                      { label: "Total Payouts", value: `KSh ${d.revenue.reduce((s,r)=>s+r.payouts,0).toFixed(1)}M` },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-center">
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100">{value}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* User Growth Stacked Bar */}
              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" title="User Acquisition" sub="New vs Returning"
                    action={<div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />New</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600 inline-block" />Returning</span>
                    </div>} />
                  <StackedBarChart data={d.userGrowth} height={180} />
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                      <p className="text-sm font-black text-blue-700 dark:text-blue-400">{d.userGrowth.reduce((s,u)=>s+u.new,0).toLocaleString()} new</p>
                      <p className="text-[10px] text-blue-500/70 uppercase tracking-wider mt-0.5">Acquired</p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                      <p className="text-sm font-black text-rose-600 dark:text-rose-400">{d.userGrowth.reduce((s,u)=>s+u.churned,0).toLocaleString()} churned</p>
                      <p className="text-[10px] text-rose-400/70 uppercase tracking-wider mt-0.5">Churn</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Booking Heatmap + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" title="Bookings by Day of Week" sub="Average distribution" />
                  <BookingHeatmap data={d.bookingsByDay} />
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>Peak: <strong className="text-slate-700 dark:text-slate-300">Saturday ({Math.max(...d.bookingsByDay.map(b=>b.count))})</strong></span>
                    <span>Avg/day: <strong className="text-slate-700 dark:text-slate-300">{Math.round(d.bookingsByDay.reduce((s,b)=>s+b.count,0)/7)}</strong></span>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" title="System Alerts" sub="Recent flags and notices" />
                  <div className="space-y-2.5">
                    {d.recentAlerts.map((a, i) => <AlertItem key={i} alert={a} />)}
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ────────────── REVENUE TAB ────────────── */}
        {activeTab === "revenue" && (
          <motion.div key="rev" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={fade} className="lg:col-span-2">
                <Card className="p-6">
                  <SectionTitle icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" title="Monthly Revenue Breakdown" sub="Gross · Net · Payouts · Refunds" />
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          {["Month","Gross","Net Comm","Payouts","Refunds","Margin"].map(h => (
                            <th key={h} className="pb-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {d.revenue.map((r, i) => {
                          const margin = ((r.net / r.gross) * 100).toFixed(1);
                          return (
                            <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 font-bold text-slate-700 dark:text-slate-300 text-sm">{r.label}</td>
                              <td className="py-3 font-black text-emerald-600 dark:text-emerald-400 text-sm">KSh {r.gross}M</td>
                              <td className="py-3 font-bold text-blue-600 dark:text-blue-400 text-sm">KSh {r.net}M</td>
                              <td className="py-3 text-slate-600 dark:text-slate-400 text-sm">KSh {r.payouts}M</td>
                              <td className="py-3 text-rose-500 dark:text-rose-400 text-sm">KSh {r.refunds}M</td>
                              <td className="py-3"><span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-black">{margin}%</span></td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50 dark:bg-slate-900/40">
                          <td className="py-3 font-black text-slate-900 dark:text-slate-100 text-sm">Total</td>
                          <td className="py-3 font-black text-emerald-600 dark:text-emerald-400 text-sm">KSh {d.revenue.reduce((s,r)=>s+r.gross,0).toFixed(1)}M</td>
                          <td className="py-3 font-black text-blue-600 dark:text-blue-400 text-sm">KSh {d.revenue.reduce((s,r)=>s+r.net,0).toFixed(2)}M</td>
                          <td className="py-3 font-bold text-slate-600 dark:text-slate-400 text-sm">KSh {d.revenue.reduce((s,r)=>s+r.payouts,0).toFixed(2)}M</td>
                          <td className="py-3 font-bold text-rose-500 text-sm">KSh {d.revenue.reduce((s,r)=>s+r.refunds,0).toFixed(2)}M</td>
                          <td className="py-3"><span className="text-xs font-black text-slate-500">10.0%</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fade} className="space-y-4">
                <Card className="p-6">
                  <SectionTitle icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" title="Payment Methods" sub="By volume share" />
                  <div className="flex justify-center mb-4">
                    <DonutChart segments={d.paymentMethods.map((p,i)=>({ pct: p.pct, label: p.method, color: ["#3b82f6","#10b981","#f59e0b","#8b5cf6"][i] }))} size={130} />
                  </div>
                  <div className="space-y-2.5">
                    {d.paymentMethods.map((p, i) => {
                      const colors = ["bg-blue-500","bg-emerald-500","bg-amber-500","bg-violet-500"];
                      return (
                        <div key={p.method} className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${colors[i]} flex-shrink-0`} />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex-1">{p.method}</span>
                          <span className="text-xs text-slate-400">KSh {p.amount}M</span>
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 w-10 text-right">{p.pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ────────────── USERS TAB ────────────── */}
        {activeTab === "users" && (
          <motion.div key="usr" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" title="User Conversion Funnel" sub="Registration to repeat booker" />
                  <FunnelChart stages={d.kycFunnel} />
                </Card>
              </motion.div>
              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" title="KYC Status Breakdown" sub="Platform-wide verification rates" />
                  <div className="space-y-5 mt-2">
                    {[
                      { label: "Verified",   count: 8210, pct: 65.8, color: "bg-emerald-500" },
                      { label: "Pending",    count: 2840, pct: 22.8, color: "bg-amber-400" },
                      { label: "Rejected",   count: 960,  pct: 7.7,  color: "bg-rose-500" },
                      { label: "Unsubmitted",count: 470,  pct: 3.7,  color: "bg-slate-300 dark:bg-slate-700" },
                    ].map(({ label, count, pct, color }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{count.toLocaleString()}</span>
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100">{pct}%</span>
                          </div>
                        </div>
                        <HBar value={pct} max={100} color={color} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">2,840 users pending KYC review · Avg wait: 38 hours</p>
                  </div>
                </Card>
              </motion.div>
            </div>

            <motion.div variants={fade}>
              <Card className="p-6">
                <SectionTitle icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" title="Monthly User Cohort Summary" sub="New · Returning · Churned" />
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        {["Month","New","Returning","Churned","Net Growth","Retention"].map(h => (
                          <th key={h} className="pb-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.userGrowth.map((u, i) => {
                        const net = u.new - u.churned;
                        const retention = Math.round((u.returning / (u.returning + u.churned)) * 100);
                        return (
                          <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 font-bold text-slate-700 dark:text-slate-300 text-sm">{u.label}</td>
                            <td className="py-3 text-blue-600 dark:text-blue-400 font-bold text-sm">+{u.new.toLocaleString()}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-400 text-sm">{u.returning.toLocaleString()}</td>
                            <td className="py-3 text-rose-500 text-sm">-{u.churned}</td>
                            <td className="py-3"><span className={`font-black text-sm ${net > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>{net > 0 ? "+" : ""}{net}</span></td>
                            <td className="py-3"><span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-black">{retention}%</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* ────────────── FLEET TAB ────────────── */}
        {activeTab === "fleet" && (
          <motion.div key="flt" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" title="Fleet by Vehicle Type" sub="Distribution & utilization" />
                  <div className="space-y-5">
                    {d.vehicleTypes.map(v => {
                      const utilColor = v.utilization >= 80 ? "bg-emerald-500" : v.utilization >= 65 ? "bg-amber-400" : "bg-rose-500";
                      return (
                        <div key={v.type}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{v.type}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">{v.count} units</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">KSh {v.revenue}M rev</span>
                              <span className={`text-xs font-black ${v.utilization >= 80 ? "text-emerald-600 dark:text-emerald-400" : v.utilization >= 65 ? "text-amber-500" : "text-rose-500"}`}>{v.utilization}%</span>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <HBar value={v.pct} max={40} color="bg-blue-500/30" />
                            <HBar value={v.utilization} max={100} color={utilColor} />
                          </div>
                          <div className="flex gap-4 mt-1">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Share: {v.pct}%</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Utilization: {v.utilization}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fade} className="space-y-4">
                <Card className="p-6">
                  <SectionTitle icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" title="Fleet Health Snapshot" sub="Platform-wide" />
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Listed",    value: d.kpis.vehicles, color: "text-slate-900 dark:text-slate-100" },
                      { label: "Active / Rented",  value: Math.round(d.kpis.vehicles * d.kpis.utilization / 100), color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Available",        value: Math.round(d.kpis.vehicles * (1 - d.kpis.utilization / 100)), color: "text-blue-600 dark:text-blue-400" },
                      { label: "Under Maintenance",value: 31, color: "text-amber-600 dark:text-amber-400" },
                      { label: "Suspended",        value: 12, color: "text-rose-600 dark:text-rose-400" },
                      { label: "Utilization",      value: `${d.kpis.utilization}%`, color: "text-violet-600 dark:text-violet-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <p className={`text-xl font-black ${color}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-6 border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/5">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Fleet Insight</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">Luxury vehicles achieve the highest utilization at <strong>88%</strong>, yet represent only 6.3% of listings. Consider incentivizing dealers to expand luxury inventory.</p>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ────────────── DEALERS TAB ────────────── */}
        {activeTab === "dealers" && (
          <motion.div key="dlr" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            <motion.div variants={fade}>
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <SectionTitle icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" title="Dealer Performance Leaderboard" sub={`${d.topDealers.length} dealers ranked by gross revenue`} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                        {["Rank","Dealer","Fleet","Utilization","Rentals","Gross Revenue","Growth","Rating"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.topDealers.map((dealer, i) => (
                        <motion.tr key={dealer.id} variants={fade}
                          className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                              i === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                              i === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300" :
                              i === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                              "bg-slate-100 text-slate-400 dark:bg-slate-900"}`}>
                              #{i + 1}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{dealer.name}</p>
                            <p className="text-[10px] text-slate-400">{dealer.location} · {dealer.id}</p>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{dealer.fleet}</td>
                          <td className="px-5 py-4 min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <HBar value={dealer.utilization} max={100} color={dealer.utilization >= 80 ? "bg-emerald-500" : dealer.utilization >= 65 ? "bg-amber-400" : "bg-rose-500"} />
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex-shrink-0">{dealer.utilization}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{dealer.rentals.toLocaleString()}</td>
                          <td className="px-5 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400">KSh {(dealer.gross / 1e6).toFixed(1)}M</td>
                          <td className="px-5 py-4"><Delta value={dealer.growth} /></td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <Icon d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" size={14} className="text-amber-400" fill="currentColor" />
                              <span className="text-sm font-black text-slate-700 dark:text-slate-300">{dealer.rating}</span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
                  <p className="text-xs text-slate-400">Total Dealer Gross: <strong className="text-slate-700 dark:text-slate-300">KSh {(d.topDealers.reduce((s,dl)=>s+dl.gross,0)/1e6).toFixed(1)}M</strong></p>
                  <p className="text-xs text-slate-400">Avg Rating: <strong className="text-slate-700 dark:text-slate-300">{(d.topDealers.reduce((s,dl)=>s+dl.rating,0)/d.topDealers.length).toFixed(1)}</strong></p>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* ────────────── GEOGRAPHY TAB ────────────── */}
        {activeTab === "geography" && (
          <motion.div key="geo" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" title="Revenue by County" sub="Geographic distribution" />
                  <div className="space-y-4 mt-2">
                    {d.geoRevenue.map((g, i) => {
                      const colors = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-400","bg-slate-400 dark:bg-slate-600"];
                      const textColors = ["text-blue-600 dark:text-blue-400","text-emerald-600 dark:text-emerald-400","text-violet-600 dark:text-violet-400","text-amber-600 dark:text-amber-400","text-slate-500 dark:text-slate-400"];
                      return (
                        <div key={g.county}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${colors[i]} flex-shrink-0`} />
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{g.county}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">{g.bookings.toLocaleString()} bookings</span>
                              <span className={`text-sm font-black ${textColors[i]}`}>KSh {g.revenue}M</span>
                              <span className="text-xs font-black text-slate-400 w-12 text-right">{g.share}%</span>
                            </div>
                          </div>
                          <HBar value={g.share} max={60} color={colors[i]} />
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={fade}>
                <Card className="p-6">
                  <SectionTitle icon="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" title="Geographic Share" sub="Revenue distribution" />
                  <div className="flex justify-center mb-4">
                    <DonutChart size={150} segments={d.geoRevenue.map((g, i) => ({
                      pct: Math.round(g.share), label: g.county,
                      color: ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#94a3b8"][i]
                    }))} />
                  </div>
                  <div className="space-y-2">
                    {d.geoRevenue.map((g, i) => (
                      <div key={g.county} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full`} style={{ background: ["#3b82f6","#10b981","#8b5cf6","#f59e0b","#94a3b8"][i] }} />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{g.county}</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">{g.share}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Nairobi dominates with 56.8% of gross revenue. Consider targeted campaigns to grow Nakuru and upcountry markets.</p>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}