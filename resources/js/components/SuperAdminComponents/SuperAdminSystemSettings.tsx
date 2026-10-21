import { useState, type ReactNode } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Percent, CalendarClock, Power, ShieldCheck, LifeBuoy, Info, Save, RotateCcw, AlertTriangle, X } from "lucide-react";
import LoadState from "../LoadState";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { dateTime } from "@/lib/format";

interface SettingsValues {
  commission_rate: number;
  subscription_due_days: number;
  min_booking_hours: number;
  max_booking_days: number;
  free_cancellation_hours: number;
  min_driver_age: number;
  customer_registration: boolean;
  dealer_registration: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  login_attempts_per_minute: number;
  session_lifetime_minutes: number;
  support_email: string | null;
  support_phone: string | null;
}
interface SettingsResponse {
  data: SettingsValues;
  fixed: { vat_rate: number; currency: string; timezone: string };
  last_updated: { at: string; by: string | null } | null;
}
type Draft = Record<keyof SettingsValues, string | boolean>;

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40";

// The commission is stored as a fraction but edited as a percentage.
const toDraft = (v: SettingsValues): Draft => {
  const d = {} as Draft;
  (Object.keys(v) as (keyof SettingsValues)[]).forEach((k) => {
    const value = v[k];
    d[k] = typeof value === "boolean" ? value : k === "commission_rate" ? String(Math.round((value as number) * 10000) / 100) : String(value ?? "");
  });
  return d;
};
const toPayload = (d: Draft, changed: (keyof SettingsValues)[]) =>
  Object.fromEntries(changed.map((k) => {
    const v = d[k];
    if (typeof v === "boolean") return [k, v];
    if (k === "commission_rate") return [k, Number(v) / 100];
    if (k === "support_email" || k === "support_phone" || k === "maintenance_message") return [k, v === "" ? null : v];
    return [k, Number(v)];
  }));

const Section = ({ icon: Icon, title, sub, tone, children }: { icon: typeof Percent; title: string; sub?: string; tone: string; children: ReactNode }) => (
  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm overflow-hidden h-full">
    <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-4 h-4" /></div>
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
  </button>
);

export default function SuperAdminSystemSettings() {
  const { data, loading, error, reload, setData } = useApi<SettingsResponse>("/api/admin/settings");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  const base = toDraft(data.data);
  const d = draft ?? base;
  const changed = (Object.keys(base) as (keyof SettingsValues)[]).filter((k) => d[k] !== base[k]);

  const set = (k: keyof SettingsValues, v: string | boolean) => { setSaved(false); setDraft({ ...d, [k]: v }); };
  const save = async () => {
    setSaving(true);
    try {
      const res = await api<SettingsResponse>("/api/admin/settings", { method: "PUT", body: toPayload(d, changed) });
      setData(res);
      setDraft(null);
      setErrors({});
      setSaved(true);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const num = (k: keyof SettingsValues, label: string, hint: string, suffix?: string) => (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
      <div className="relative">
        <input type="number" inputMode="decimal" value={d[k] as string} onChange={(e) => set(k, e.target.value)} className={`${inputClass} ${suffix ? "pr-14" : ""}`} />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{suffix}</span>}
      </div>
      <span className={`block text-xs mt-1 ${errors[k] ? "text-rose-500" : "text-slate-500"}`}>{errors[k] ?? hint}</span>
    </label>
  );
  const text = (k: keyof SettingsValues, label: string, hint: string, type = "text") => (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
      <input type={type} value={d[k] as string} onChange={(e) => set(k, e.target.value)} className={inputClass} />
      <span className={`block text-xs mt-1 ${errors[k] ? "text-rose-500" : "text-slate-500"}`}>{errors[k] ?? hint}</span>
    </label>
  );
  const row = (k: keyof SettingsValues, label: string, description: string, onToggle?: (v: boolean) => void) => (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <Toggle label={label} on={d[k] as boolean} onChange={onToggle ?? ((v) => set(k, v))} />
    </div>
  );
  const fixed = (label: string, value: string, note: string) => (
    <div className="flex items-start justify-between gap-4 py-1">
      <div><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p><p className="text-xs text-slate-500">{note}</p></div>
      <span className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">{value}</span>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-28">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Platform rules that take effect immediately. Every change is recorded in the <Link to="/superadmin-audit-logs" className="text-blue-600 hover:underline">audit log</Link>.</p>
        </div>
        {data.last_updated && <p className="text-xs text-slate-400">Last changed {dateTime(data.last_updated.at)}{data.last_updated.by && ` by ${data.last_updated.by}`}</p>}
      </motion.div>

      {d.maintenance_mode && (
        <motion.div variants={itemVariants} role="status" className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0" /> Maintenance mode {base.maintenance_mode ? "is on" : "will turn on when you save"}: customers and dealers can't sign in or use the app.
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Section icon={Percent} title="Money" sub="Fees and billing" tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <div className="grid grid-cols-2 gap-4">
              {num("commission_rate", "Platform commission", "Of each payment, before VAT. Applies to payments recorded from now on.", "%")}
              {num("subscription_due_days", "Subscription terms", "Days after the 1st before a plan charge is overdue.", "days")}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {fixed("VAT", `${Math.round(data.fixed.vat_rate * 100)}%`, "Kenya standard rate, included in booking totals. Set in config, not here.")}
              {fixed("Currency", data.fixed.currency, "All amounts are in Kenya shillings.")}
            </div>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={CalendarClock} title="Booking Rules" sub="Apply to customer bookings; dealer staff can book outside them" tone="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <div className="grid grid-cols-2 gap-4">
              {num("min_booking_hours", "Minimum length", "Shortest booking a customer can make.", "hours")}
              {num("max_booking_days", "Maximum length", "Longer hires go through the dealer.", "days")}
              {num("free_cancellation_hours", "Cancellation cut-off", "Customers can't cancel themselves closer to pickup than this. 0 = any time.", "hours")}
              {num("min_driver_age", "Minimum driver age", "Checked when the customer's date of birth is on file.", "years")}
            </div>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={Power} title="Access" sub="Who can sign up and use the platform" tone="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            {row("customer_registration", "Customer sign-up", "Let new customers create accounts from the sign-up page.")}
            {row("dealer_registration", "Dealer sign-up", "Let car hire businesses register themselves. Admins can always onboard dealers.")}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {row("maintenance_mode", "Maintenance mode", "Locks out customers, dealers and HR. Super admins keep full access.",
                (v) => (v && !base.maintenance_mode ? setConfirmMaintenance(true) : set("maintenance_mode", v)))}
              {text("maintenance_message", "Message shown while locked", "Shown on the sign-in page and to anyone who is signed in.")}
            </div>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={ShieldCheck} title="Sign-in & Sessions" tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <div className="grid grid-cols-2 gap-4">
              {num("login_attempts_per_minute", "Sign-in attempts", "Per email and network, per minute, before a short lock-out.", "/ min")}
              {num("session_lifetime_minutes", "Idle sign-out", "Signed-in users are logged out after this long without activity.", "min")}
            </div>
            <p className="text-xs text-slate-500 flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Two-factor sign-in and IP allow-lists aren't built yet. Suspended accounts are signed out on their next request.
            </p>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={LifeBuoy} title="Support Contacts" sub="Shown to customers and dealers on their help pages" tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {text("support_email", "Support email", "Leave blank to hide.", "email")}
              {text("support_phone", "Support phone", "e.g. +254 700 123 456. Leave blank to hide.", "tel")}
            </div>
          </Section>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Section icon={Info} title="Server" sub="Set by whoever deploys the app" tone="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {fixed("Time zone", data.fixed.timezone, data.fixed.timezone === "UTC"
              ? "Dates such as \"today\" and month ends follow UTC, three hours behind Nairobi. Setting the app to Africa/Nairobi is recommended before going live."
              : "Used for dates such as \"today\" and month ends.")}
            <p className="text-xs text-slate-500">Payment gateways, SMS and other services are listed under <Link to="/superadmin-integrations" className="text-blue-600 hover:underline">Integrations</Link>.</p>
          </Section>
        </motion.div>
      </div>

      <AnimatePresence>
        {(changed.length > 0 || saved) && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl">
            {changed.length > 0 ? (
              <>
                <span className="text-sm font-bold">{changed.length} unsaved change{changed.length === 1 ? "" : "s"}</span>
                {Object.keys(errors).length > 0 && <span className="text-xs text-rose-300 dark:text-rose-600">Fix the highlighted fields</span>}
                <button onClick={() => { setDraft(null); setErrors({}); }} className="flex items-center gap-1.5 text-sm font-bold opacity-80 hover:opacity-100"><RotateCcw className="w-4 h-4" /> Discard</button>
                <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-60"><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save changes"}</button>
              </>
            ) : (
              <span role="status" className="text-sm font-bold">Settings saved. They apply to new requests straight away.</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmMaintenance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmMaintenance(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} role="dialog" aria-modal="true" aria-label="Turn on maintenance mode"
              className="w-full max-w-md bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500" /> Turn on maintenance mode?</h3>
                <button onClick={() => setConfirmMaintenance(false)} aria-label="Close" className="text-slate-400"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Once you save, every customer, dealer and HR user is locked out until you turn it off. Bookings in progress aren't affected, but nobody can make changes.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmMaintenance(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
                <button onClick={() => { set("maintenance_mode", true); setConfirmMaintenance(false); }} className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold">Turn on</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
