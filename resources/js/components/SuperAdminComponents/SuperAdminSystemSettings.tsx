import { useState, type ChangeEventHandler, type ComponentType, type MouseEventHandler, type ReactNode } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";

// ─── Stub components (replace with your actual imports) ───────────────────────
type ButtonVariant = "primary" | "danger" | "ghost" | "outline";

interface ButtonProps {
  children?: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

const Button = ({ children, className = "", variant = "primary", size = "md", onClick, disabled }: ButtonProps) => {
  const base = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20",
    ghost: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300",
    outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

interface InputProps {
  label?: ReactNode;
  value: string | number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  type?: string;
  placeholder?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

const Input = ({ label, value, onChange, type = "text", placeholder, prefix, suffix, hint, error }: InputProps) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{label}</label>}
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 text-slate-400 text-sm font-medium">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-slate-50 dark:bg-slate-900 border ${error ? "border-rose-500" : "border-slate-200 dark:border-slate-700"} rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${prefix ? "pl-7" : ""} ${suffix ? "pr-10" : ""}`}
      />
      {suffix && <span className="absolute right-3 text-slate-400 text-sm">{suffix}</span>}
    </div>
    {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    {error && <p className="text-xs text-rose-500">{error}</p>}
  </div>
);

const Toggle = ({ value, onChange, color = "blue" }: { value: boolean; onChange: () => void; color?: string }) => {
  const colors: Record<string, string> = { blue: "bg-blue-600", rose: "bg-rose-600", emerald: "bg-emerald-600", amber: "bg-amber-500" };
  return (
    <div onClick={onChange} className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ${value ? colors[color] : "bg-slate-300 dark:bg-slate-700"}`}>
      <motion.span animate={{ x: value ? 22 : 4 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="inline-block h-5 w-5 rounded-full bg-white shadow-sm" />
    </div>
  );
};

const Badge = ({ children, color = "slate" }: { children?: ReactNode; color?: string }) => {
  const colors: Record<string, string> = { slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400", amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400", blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${colors[color]}`}>{children}</span>;
};

// ─── Icons (inline SVG to avoid import issues in isolation) ───────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: ReactNode; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const Icons = {
  Save: () => <Icon d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8" />,
  Percent: () => <Icon d={<><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></>} />,
  Server: () => <Icon d="M22 2H2v8h20zM22 14H2v8h20z M6 6h.01M6 18h.01" />,
  Power: () => <Icon d="M18.36 6.64a9 9 0 1 1-12.73 0 M12 2v10" />,
  Shield: () => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  Settings: () => <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 12 2a10 10 0 0 0-7.07 2.93M4.93 4.93A10 10 0 0 0 2 12a10 10 0 0 0 2.93 7.07M19.07 19.07A10 10 0 0 1 12 22a10 10 0 0 1-7.07-2.93M19.07 19.07A10 10 0 0 0 22 12a10 10 0 0 0-2.93-7.07"/></>} />,
  Users: () => <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />,
  Car: () => <Icon d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v7a2 2 0 0 1-2 2h-2 M7 17h10 M9 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  Globe: () => <Icon d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>} />,
  Bell: () => <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" />,
  Key: () => <Icon d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />,
  Mail: () => <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />,
  Clock: () => <Icon d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />,
  Database: () => <Icon d={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>} />,
  CreditCard: () => <Icon d="M1 4h22v16H1z M1 10h22" />,
  Map: () => <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
  AlertTriangle: () => <Icon d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />,
  CheckCircle: () => <Icon d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} />,
  RefreshCw: () => <Icon d="M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />,
  Eye: () => <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
  Trash: () => <Icon d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  Plus: () => <Icon d="M12 5v14M5 12h14" />,
  ChevronDown: () => <Icon d="M6 9l6 6 6-6" />,
  Upload: () => <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12" />,
  Sliders: () => <Icon d="M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6" />,
  Activity: () => <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  Lock: () => <Icon d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4" />,
  Building: () => <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />,
};

// ─── Section wrapper ──────────────────────────────────────────────────────────
interface SectionProps {
  icon: ComponentType;
  title: ReactNode;
  color?: string;
  children?: ReactNode;
  action?: ReactNode;
}

const Section = ({ icon: IconComp, title, color = "blue", children, action }: SectionProps) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600",
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600",
    violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600",
  };
  return (
    <div className="p-8 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm space-y-6 h-fit">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colors[color]}`}><IconComp /></div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

const SettingRow = ({ label, description, children }: { label: ReactNode; description?: ReactNode; children?: ReactNode }) => (
  <div className="flex items-start justify-between gap-6 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } } };
const containerVariants: Variants = { show: { transition: { staggerChildren: 0.07 } } };

// ─── CONFIRMATION MODAL ───────────────────────────────────────────────────────
interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
}

const ConfirmModal = ({ open, title, message, confirmLabel = "Confirm", confirmVariant = "danger", onConfirm, onCancel }: Partial<ConfirmState> & { open: boolean; onCancel: () => void }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600"><Icons.AlertTriangle /></div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── TENANT ROW ───────────────────────────────────────────────────────────────
interface Tenant {
  id: number;
  name: string;
  domain: string;
  cars: number;
  agents: number;
  active: boolean;
}

const TenantRow = ({ tenant, onToggle, onEdit }: { tenant: Tenant; onToggle: (id: number) => void; onEdit: (tenant: Tenant) => void }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shrink-0">
      {tenant.name.slice(0, 2).toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{tenant.name}</p>
      <p className="text-xs text-slate-500 truncate">{tenant.domain} · {tenant.cars} vehicles · {tenant.agents} agents</p>
    </div>
    <div className="flex items-center gap-3">
      <Badge color={tenant.active ? "emerald" : "slate"}>{tenant.active ? "Active" : "Suspended"}</Badge>
      <Toggle value={tenant.active} onChange={() => onToggle(tenant.id)} color={tenant.active ? "emerald" : "slate"} />
      <button onClick={() => onEdit(tenant)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
        <Icons.Settings />
      </button>
    </div>
  </div>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SuperAdminSystem() {
  // ── Financial ──────────────────────────────────────────────────
  const [commission, setCommission] = useState("10");
  const [vatRate, setVatRate] = useState("16");
  const [lateFee, setLateFee] = useState("500");
  const [depositMultiplier, setDepositMultiplier] = useState("1.5");
  const [currency, setCurrency] = useState("KES");
  const [payoutCycle, setPayoutCycle] = useState("weekly");

  // ── Platform state ────────────────────────────────────────────
  const [maintenance, setMaintenance] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [apiEnabled, setApiEnabled] = useState(true);
  const [mobileEnabled, setMobileEnabled] = useState(true);

  // ── Security ──────────────────────────────────────────────────
  const [mfaRequired, setMfaRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [auditLog, setAuditLog] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);

  // ── Notifications ─────────────────────────────────────────────
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [adminEmail, setAdminEmail] = useState("admin@carhire.co.ke");
  const [supportEmail, setSupportEmail] = useState("support@carhire.co.ke");
  const [smsProvider, setSmsProvider] = useState("africas_talking");

  // ── Booking rules ─────────────────────────────────────────────
  const [minBookingHours, setMinBookingHours] = useState("4");
  const [maxBookingDays, setMaxBookingDays] = useState("30");
  const [cancellationWindow, setCancellationWindow] = useState("24");
  const [driverAgeMin, setDriverAgeMin] = useState("21");
  const [requireLicenseVerif, setRequireLicenseVerif] = useState(true);
  const [allowSelfDrive, setAllowSelfDrive] = useState(true);
  const [allowChauffeur, setAllowChauffeur] = useState(true);

  // ── Tenants ───────────────────────────────────────────────────
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: 1, name: "Savanna Car Hire", domain: "savanna.carhire.co.ke", cars: 34, agents: 8, active: true },
    { id: 2, name: "Nairobi Wheels", domain: "nairobiWheels.ke", cars: 19, agents: 4, active: true },
    { id: 3, name: "Safari Rentals Ltd", domain: "safarirentals.co.ke", cars: 52, agents: 12, active: false },
    { id: 4, name: "Coastal Drives KE", domain: "coastaldrives.ke", cars: 11, agents: 3, active: true },
  ]);

  // ── Integrations ─────────────────────────────────────────────
  const [mpesaEnabled, setMpesaEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [mpesaShortcode, setMpesaShortcode] = useState("174379");
  const [googleMapsKey, setGoogleMapsKey] = useState("AIza●●●●●●●●●●●●●");
  const [gpsTracking, setGpsTracking] = useState(true);
  const [gpsProvider, setGpsProvider] = useState("traccar");

  // ── Localization ──────────────────────────────────────────────
  const [timezone, setTimezone] = useState("Africa/Nairobi");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [language, setLanguage] = useState("en");

  // ── Confirm modal ─────────────────────────────────────────────
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const toggleTenant = (id: number) => setTenants(ts => ts.map(t => t.id === id ? { ...t, active: !t.active } : t));

  const handleMaintenanceToggle = () => {
    if (!maintenance) {
      setConfirm({
        title: "Enable Maintenance Mode",
        message: "All customers and dealers will be locked out immediately. Only Super Admins can access the platform. Are you sure?",
        confirmLabel: "Enable Maintenance",
        onConfirm: () => { setMaintenance(true); setConfirm(null); },
      });
    } else {
      setMaintenance(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">

      <ConfirmModal open={!!confirm} {...confirm} onCancel={() => setConfirm(null)} />

      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Global platform configuration for all tenants, dealers, and customers.</p>
        </div>
        <div className="flex items-center gap-3">
          {maintenance && <Badge color="rose"><Icons.AlertTriangle /> Maintenance Active</Badge>}
          <Button className="gap-2 shadow-blue-500/20"><Icons.Save /> Save All Changes</Button>
        </div>
      </motion.div>

      {/* ── Row 1: Financial + Booking Rules ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Financial */}
        <motion.div variants={itemVariants}>
          <Section icon={Icons.Percent} title="Financial Logic" color="emerald">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Platform Commission (%)" type="number" value={commission} onChange={e => setCommission(e.target.value)} hint="Deducted from all dealer payouts" />
                <Input label="VAT / Tax Rate (%)" type="number" value={vatRate} onChange={e => setVatRate(e.target.value)} hint="Applied at checkout" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Late Return Fee" type="number" value={lateFee} onChange={e => setLateFee(e.target.value)} prefix={currency} hint="Per hour overage" />
                <Input label="Deposit Multiplier" type="number" value={depositMultiplier} onChange={e => setDepositMultiplier(e.target.value)} hint="× daily rate" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Default Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none">
                    {["KES", "USD", "EUR", "GBP", "UGX", "TZS"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Dealer Payout Cycle</label>
                  <select value={payoutCycle} onChange={e => setPayoutCycle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none">
                    {["daily", "weekly", "biweekly", "monthly"].map(c => <option key={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* Booking Rules */}
        <motion.div variants={itemVariants}>
          <Section icon={Icons.Car} title="Booking Rules" color="blue">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Min Booking (hrs)" type="number" value={minBookingHours} onChange={e => setMinBookingHours(e.target.value)} />
                <Input label="Max Booking (days)" type="number" value={maxBookingDays} onChange={e => setMaxBookingDays(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Free Cancellation (hrs)" type="number" value={cancellationWindow} onChange={e => setCancellationWindow(e.target.value)} hint="Before pickup" />
                <Input label="Min Driver Age" type="number" value={driverAgeMin} onChange={e => setDriverAgeMin(e.target.value)} />
              </div>
              <div className="space-y-2 pt-1">
                <SettingRow label="Require License Verification" description="KRA/NTSA check before first booking">
                  <Toggle value={requireLicenseVerif} onChange={() => setRequireLicenseVerif(v => !v)} color="blue" />
                </SettingRow>
                <SettingRow label="Allow Self-Drive Bookings">
                  <Toggle value={allowSelfDrive} onChange={() => setAllowSelfDrive(v => !v)} color="blue" />
                </SettingRow>
                <SettingRow label="Allow Chauffeur Bookings">
                  <Toggle value={allowChauffeur} onChange={() => setAllowChauffeur(v => !v)} color="blue" />
                </SettingRow>
              </div>
            </div>
          </Section>
        </motion.div>
      </div>

      {/* ── Row 2: Platform State + Security ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Platform State */}
        <motion.div variants={itemVariants}>
          <Section icon={Icons.Server} title="Platform State" color="rose">
            <div className="space-y-3">
              <SettingRow label="Maintenance Mode" description="Locks all customers & dealers. Super Admins bypass.">
                <Toggle value={maintenance} onChange={handleMaintenanceToggle} color="rose" />
              </SettingRow>
              <SettingRow label="New Dealer Registration" description="Allow new dealers to self-register.">
                <Toggle value={registrationOpen} onChange={() => setRegistrationOpen(v => !v)} color="emerald" />
              </SettingRow>
              <SettingRow label="Public REST API" description="3rd-party integrations and mobile apps.">
                <Toggle value={apiEnabled} onChange={() => setApiEnabled(v => !v)} color="blue" />
              </SettingRow>
              <SettingRow label="Mobile App Access" description="iOS & Android customer apps.">
                <Toggle value={mobileEnabled} onChange={() => setMobileEnabled(v => !v)} color="blue" />
              </SettingRow>

              <div className={`mt-2 p-4 rounded-2xl border transition-colors ${maintenance ? "border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5" : "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5"}`}>
                <div className="flex items-center gap-3">
                  {maintenance ? <Icons.AlertTriangle /> : <Icons.CheckCircle />}
                  <p className={`text-xs font-bold leading-relaxed ${maintenance ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                    {maintenance ? "⚠ Platform is in maintenance mode. All users are locked out." : "✓ Platform is live. Automated DB backups run every 6 hours."}
                  </p>
                </div>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* Security */}
        <motion.div variants={itemVariants}>
          <Section icon={Icons.Lock} title="Security & Access" color="violet">
            <div className="space-y-4">
              <SettingRow label="Require MFA for Admins" description="Enforces TOTP or SMS on all admin logins.">
                <Toggle value={mfaRequired} onChange={() => setMfaRequired(v => !v)} color="violet" />
              </SettingRow>
              <SettingRow label="Audit Log" description="Record all admin actions with IP & timestamp.">
                <Toggle value={auditLog} onChange={() => setAuditLog(v => !v)} color="blue" />
              </SettingRow>
              <SettingRow label="Fraud & Anomaly Alerts" description="Flag suspicious booking or payment patterns.">
                <Toggle value={fraudAlerts} onChange={() => setFraudAlerts(v => !v)} color="amber" />
              </SettingRow>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <Input label="Session Timeout (min)" type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} />
                <Input label="Max Login Attempts" type="number" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(e.target.value)} />
              </div>
              <Input label="IP Allowlist" value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} placeholder="0.0.0.0, 105.163.x.x …" hint="Comma-separated. Leave blank to allow all." />
            </div>
          </Section>
        </motion.div>
      </div>

      {/* ── Row 3: Integrations + Notifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Integrations */}
        <motion.div variants={itemVariants}>
          <Section icon={Icons.CreditCard} title="Payment & Integrations" color="amber">
            <div className="space-y-4">
              <SettingRow label="M-Pesa (Daraja API)" description="Lipa Na M-Pesa STK push for Kenyan customers.">
                <Toggle value={mpesaEnabled} onChange={() => setMpesaEnabled(v => !v)} color="emerald" />
              </SettingRow>
              {mpesaEnabled && (
                <Input label="M-Pesa Business Shortcode" value={mpesaShortcode} onChange={e => setMpesaShortcode(e.target.value)} />
              )}
              <SettingRow label="Stripe (Card Payments)" description="Visa / MasterCard for diaspora & corporate.">
                <Toggle value={stripeEnabled} onChange={() => setStripeEnabled(v => !v)} color="blue" />
              </SettingRow>
              <hr className="border-slate-100 dark:border-slate-800" />
              <SettingRow label="GPS Vehicle Tracking" description="Live location data for all fleet vehicles.">
                <Toggle value={gpsTracking} onChange={() => setGpsTracking(v => !v)} color="blue" />
              </SettingRow>
              {gpsTracking && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">GPS Provider</label>
                  <select value={gpsProvider} onChange={e => setGpsProvider(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none">
                    {["traccar", "fleet_complete", "samsara", "custom"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1).replace("_", " ")}</option>)}
                  </select>
                </div>
              )}
              <Input label="Google Maps API Key" value={googleMapsKey} onChange={e => setGoogleMapsKey(e.target.value)} hint="Used for pickup/drop-off location search" />
            </div>
          </Section>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants}>
          <Section icon={Icons.Bell} title="Notifications & Comms" color="blue">
            <div className="space-y-4">
              <SettingRow label="Email Notifications" description="Booking confirmations, receipts, alerts.">
                <Toggle value={emailNotifs} onChange={() => setEmailNotifs(v => !v)} color="blue" />
              </SettingRow>
              <SettingRow label="SMS Notifications" description="OTP, pickup reminders, payment confirmations.">
                <Toggle value={smsNotifs} onChange={() => setSmsNotifs(v => !v)} color="emerald" />
              </SettingRow>
              <SettingRow label="Push Notifications" description="In-app alerts via mobile app.">
                <Toggle value={pushNotifs} onChange={() => setPushNotifs(v => !v)} color="blue" />
              </SettingRow>
              {smsNotifs && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">SMS Provider</label>
                  <select value={smsProvider} onChange={e => setSmsProvider(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none">
                    {["africas_talking", "twilio", "vonage", "wavemobile"].map(p => <option key={p} value={p}>{p.replace("_", "'s ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
              )}
              <Input label="Primary Admin Email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
              <Input label="Customer Support Email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
            </div>
          </Section>
        </motion.div>
      </div>

      {/* Client Management */}
      <motion.div variants={itemVariants}>
        <Section
          icon={Icons.Building}
          title="Client Management"
          color="slate"
          action={
            <Button size="sm" variant="outline" className="gap-2">
              <Icons.Plus /> Add Tenant
            </Button>
          }
        >
          <div className="space-y-2">
            {tenants.map(tenant => (
              <TenantRow key={tenant.id} tenant={tenant} onToggle={toggleTenant} onEdit={() => {}} />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { label: "Total Tenants", value: tenants.length, color: "text-slate-700 dark:text-slate-300" },
              { label: "Active", value: tenants.filter(t => t.active).length, color: "text-emerald-600" },
              { label: "Suspended", value: tenants.filter(t => !t.active).length, color: "text-rose-500" },
              { label: "Total Vehicles", value: tenants.reduce((s, t) => s + t.cars, 0), color: "text-blue-600" },
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>

      {/* ── Row 5: Localization + Maintenance Tools ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Localization */}
        <motion.div variants={itemVariants}>
          <Section icon={Icons.Globe} title="Localization" color="emerald">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none">
                  {["Africa/Nairobi", "Africa/Lagos", "Africa/Cairo", "Africa/Johannesburg", "UTC", "Europe/London", "America/New_York"].map(tz => <option key={tz}>{tz}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Date Format</label>
                  <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none">
                    {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Platform Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none">
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>
          </Section>
        </motion.div>

        {/* Admin Tools */}
        <motion.div variants={itemVariants}>
          <Section icon={Icons.Sliders} title="Admin Tools" color="slate">
            <div className="space-y-3">
              {[
                { icon: Icons.Database, label: "Manual Database Backup", desc: "Trigger an immediate encrypted backup", btn: "Run Backup", variant: "outline" },
                { icon: Icons.RefreshCw, label: "Flush Platform Cache", desc: "Clear all in-memory and CDN caches", btn: "Flush Cache", variant: "outline" },
                { icon: Icons.Activity, label: "View System Audit Log", desc: "All admin actions, IPs, timestamps", btn: "Open Logs", variant: "ghost" },
                { icon: Icons.Upload, label: "Import Seed Data", desc: "Bulk-import vehicles, users from CSV", btn: "Upload CSV", variant: "ghost" },
                { icon: Icons.Trash, label: "Purge Test Bookings", desc: "Remove all sandbox / test transactions", btn: "Purge", variant: "danger" },
              ].map(({ icon: Ico, label, desc, btn, variant }) => (
                <div key={label} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400"><Ico /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                  <Button size="sm" variant={variant as ButtonVariant}>{btn}</Button>
                </div>
              ))}
            </div>
          </Section>
        </motion.div>
      </div>

    </motion.div>
  );
}