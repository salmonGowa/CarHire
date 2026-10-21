import { useState, type ReactNode, type SVGProps } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import LoadState from "../LoadState";
import TempPasswordNotice from "../TempPasswordNotice";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { ksh, longDate } from "@/lib/format";
import type { AccountSummary, AdminDealer, AdminDealerDetail } from "@/types/models";

// ─── Icons (inline SVG) ─────────────────────────────────────────────────────
type IconPath = string | (string | SVGProps<SVGCircleElement>)[];

const Icon = ({ d, size = 20, strokeWidth = 1.8, className = "" }: { d: IconPath; size?: number; strokeWidth?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => typeof p === "string" ? <path key={i} d={p} /> : <circle key={i} {...p} />) : <path d={d} />}
  </svg>
);

const I = {
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  plus: "M12 5v14m-7-7h14",
  back: "M19 12H5M5 12l7-7M5 12l7 7",
  eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  close: "M18 6L6 18M6 6l12 12",
  phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  car: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM3 7h18M3 7l1-4h16l1 4M3 7v7a2 2 0 002 2h1M21 7v7a2 2 0 01-2 2h-1",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  people: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  ban: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  alert: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  money: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  chevron: "M9 5l7 7-7 7",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
};

const TIER_COLORS: Record<string, string> = { platinum: "text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800", gold: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800", silver: "text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" };
const STATUS_COLORS: Record<string, string> = { active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800", suspended: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800", pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Badge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}>{status}</span>
);
const TierBadge = ({ tier }: { tier: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${TIER_COLORS[tier]}`}>{tier}</span>
);
const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
const Avatar = ({ name, size = "md", color = "blue" }: { name: string; size?: "sm" | "md" | "lg"; color?: string }) => {
  const sz = size === "lg" ? "w-16 h-16 text-lg" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const colors: Record<string, string> = { blue: "from-blue-500 to-blue-700", emerald: "from-emerald-500 to-emerald-700", rose: "from-rose-500 to-rose-700", slate: "from-slate-400 to-slate-600" };
  return <div className={`${sz} rounded-xl bg-gradient-to-br ${colors[color] ?? colors.blue} text-white font-black flex items-center justify-center flex-shrink-0`}>{initials(name)}</div>;
};
const Card = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm ${className}`}>{children}</div>
);

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all";
const Field = ({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) => (
  <label className={`block ${className}`}>
    <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
    {children}
    {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
  </label>
);

const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Modal = ({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children?: ReactNode; wide?: boolean }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
    <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
      role="dialog" aria-modal="true" aria-label={title}
      className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-white dark:bg-[#0B1120] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto`}
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#0B1120] z-10">
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
        <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Icon d={I.close} size={18} /></button>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  </motion.div>
);

// ─── Dealer form ────────────────────────────────────────────────────────────
const FIELDS = ["name", "city", "county", "address", "phone", "email", "website", "license_no", "tax_pin", "notes", "owner_name", "owner_phone", "owner_email", "owner_national_id", "manager_name", "manager_phone", "manager_email"] as const;
type DealerForm = Record<(typeof FIELDS)[number], string> & { status: AdminDealer["status"]; tier: AdminDealer["tier"] };

const toForm = (d: AdminDealer | null): DealerForm => ({
  ...(Object.fromEntries(FIELDS.map((f) => [f, d?.[f] ?? ""])) as Record<(typeof FIELDS)[number], string>),
  status: d?.status ?? "active", tier: d?.tier ?? "silver",
});
const toBody = (f: DealerForm) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === "" ? null : v]));

const DealerFormView = ({ initial, onSaved, onClose }: { initial: AdminDealer | null; onSaved: (d: AdminDealer) => void; onClose: () => void }) => {
  const [form, setForm] = useState<DealerForm>(toForm(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof DealerForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const text = (k: (typeof FIELDS)[number], label: string, opts: { type?: string; className?: string; required?: boolean } = {}) => (
    <Field label={label} error={errors[k]} className={opts.className}>
      <input type={opts.type ?? "text"} value={form[k]} onChange={set(k)} required={opts.required} className={inputClass} />
    </Field>
  );

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api<{ data: AdminDealer }>(initial ? `/api/admin/dealers/${initial.id}` : "/api/admin/dealers", { method: initial ? "PUT" : "POST", body: toBody(form) });
      onSaved(data);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {text("name", "Dealership Name", { className: "col-span-2", required: true })}
        {text("city", "City / Town", { required: true })}
        {text("county", "County")}
        {text("address", "Address", { className: "col-span-2" })}
        {text("phone", "Phone", { type: "tel" })}
        {text("email", "Email", { type: "email" })}
        {text("website", "Website")}
        {text("license_no", "License No.")}
        {text("tax_pin", "Tax PIN")}
        <Field label="Tier">
          <select value={form.tier} onChange={set("tier")} className={inputClass}><option value="silver">Silver</option><option value="gold">Gold</option><option value="platinum">Platinum</option></select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={set("status")} className={inputClass}><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option></select>
        </Field>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Owner Details</p>
        <div className="grid grid-cols-2 gap-4">
          {text("owner_name", "Full Name", { className: "col-span-2" })}
          {text("owner_phone", "Phone", { type: "tel" })}
          {text("owner_email", "Email", { type: "email" })}
          {text("owner_national_id", "National ID", { className: "col-span-2" })}
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Branch Manager</p>
        <div className="grid grid-cols-2 gap-4">
          {text("manager_name", "Full Name", { className: "col-span-2" })}
          {text("manager_phone", "Phone", { type: "tel" })}
          {text("manager_email", "Email", { type: "email" })}
        </div>
      </div>

      <Field label="Admin Notes (not shown to the dealer)" error={errors.notes} className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <textarea value={form.notes} onChange={set("notes")} rows={3} className={`${inputClass} resize-none`} />
      </Field>
      {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-60">
          {saving ? "Saving…" : initial ? "Save Changes" : "Onboard Dealer"}
        </button>
      </div>
    </div>
  );
};

// ─── Add staff form ─────────────────────────────────────────────────────────
const STAFF_LABELS = { name: "Full Name", email: "Email (used to sign in)", phone: "Phone", job_title: "Role / Position" } as const;

const StaffForm = ({ dealerId, onCreated, onClose }: { dealerId: number; onCreated: (staff: AccountSummary, password: string) => void; onClose: () => void }) => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", job_title: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const res = await api<{ data: AccountSummary; temporary_password: string }>(`/api/admin/dealers/${dealerId}/staff`, { method: "POST", body: { ...form, phone: form.phone || null } });
      onCreated(res.data, res.temporary_password);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-4">
      {(Object.keys(STAFF_LABELS) as (keyof typeof STAFF_LABELS)[]).map((k) => (
        <Field key={k} label={STAFF_LABELS[k]} error={errors[k]}>
          <input type={k === "email" ? "email" : "text"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={inputClass} required={k !== "phone"} />
        </Field>
      ))}
      <p className="text-xs text-slate-500">This creates a dealer login. You'll get a temporary password to pass on.</p>
      {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-60">{saving ? "Creating…" : "Create Login"}</button>
      </div>
    </div>
  );
};

// ─── Dealer detail ──────────────────────────────────────────────────────────
const DealerDetail = ({ dealerId, onBack, onChanged }: { dealerId: number; onBack: () => void; onChanged: () => void }) => {
  const { data, setData, error, reload } = useApi<{ data: AdminDealerDetail }>(`/api/admin/dealers/${dealerId}`);
  const [modal, setModal] = useState<"edit" | "staff" | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);
  const [message, setMessage] = useState("");
  const dealer = data?.data;

  if (!dealer) return <LoadState loading={!error} error={error} onRetry={reload} />;

  const setStatus = async (status: AdminDealer["status"]) => {
    const suspending = status === "suspended";
    if (!window.confirm(`${suspending ? "Suspend" : "Reinstate"} ${dealer.name}? ${suspending ? "Their vehicles disappear from the customer catalogue immediately." : "Their vehicles return to the catalogue."}`)) return;
    try {
      const { data: updated } = await api<{ data: AdminDealerDetail }>(`/api/admin/dealers/${dealer.id}`, { method: "PUT", body: toBody({ ...toForm(dealer), status }) });
      setData({ data: updated });
      onChanged();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const remove = async () => {
    if (!window.confirm(`Permanently delete ${dealer.name}? This only works for dealers with no bookings.`)) return;
    try {
      await api(`/api/admin/dealers/${dealer.id}`, { method: "DELETE" });
      onChanged();
      onBack();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const toggleStaff = async (s: AccountSummary) => {
    try {
      await api(`/api/admin/users/${s.id}/status`, { method: "PATCH", body: { suspended: s.status === "active" } });
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const totalFleet = dealer.fleet_breakdown.reduce((s, f) => s + f.count, 0);
  const rented = dealer.fleet_breakdown.reduce((s, f) => s + f.rented, 0);
  const TABS = ["overview", "staff", "fleet", "settings"];
  const people: [string, string | null, string | null, string | null, string | null][] = [
    ["Owner", dealer.owner_name, dealer.owner_phone, dealer.owner_email, dealer.owner_national_id],
    ["Branch Manager", dealer.manager_name, dealer.manager_phone, dealer.manager_email, null],
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} aria-label="Back to dealers" className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 transition-colors"><Icon d={I.back} size={18} /></button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{dealer.name}</h2>
              <Badge status={dealer.status} />
              <TierBadge tier={dealer.tier} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dealer.reference} · {[dealer.address, dealer.city, dealer.county].filter(Boolean).join(", ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setModal("edit")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"><Icon d={I.edit} size={15} /> Edit</button>
          <button onClick={() => setStatus(dealer.status === "suspended" ? "active" : "suspended")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md ${dealer.status === "suspended" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"}`}>
            <Icon d={dealer.status === "suspended" ? I.check : I.ban} size={15} /> {dealer.status === "suspended" ? "Reinstate" : "Suspend"}
          </button>
        </div>
      </motion.div>

      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}

      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Fleet Size", value: totalFleet, icon: I.car, bg: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
          { label: "Out on Rental", value: `${rented} (${totalFleet ? Math.round((rented / totalFleet) * 100) : 0}%)`, icon: I.check, bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
          { label: "Revenue (MTD)", value: ksh(dealer.revenue_this_month), icon: I.money, bg: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" },
          { label: "Staff Logins", value: dealer.staff.length, icon: I.people, bg: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
        ].map(({ label, value, icon, bg }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><Icon d={icon} size={20} /></div>
            <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">{value}</p></div>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={fade} className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} aria-pressed={activeTab === tab}
            className={`px-4 py-2.5 text-sm font-bold capitalize transition-all ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 -mb-px" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>{tab}</button>
        ))}
      </motion.div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Contact & Legal</h4>
            {[["Phone", dealer.phone], ["Email", dealer.email], ["Website", dealer.website], ["License No.", dealer.license_no], ["Tax PIN", dealer.tax_pin], ["Joined", longDate(dealer.joined)], ["Completed bookings", String(dealer.completed_bookings)]].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 text-sm">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{value || "—"}</span>
              </div>
            ))}
          </Card>
          <div className="space-y-4">
            {people.map(([title, name, phone, email, nid]) => (
              <Card key={title} className="p-6">
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">{title}</h4>
                {name ? (
                  <div className="flex items-start gap-4">
                    <Avatar name={name} size="md" color={title === "Owner" ? "blue" : "emerald"} />
                    <div className="space-y-1.5 text-sm">
                      <p className="font-black text-slate-900 dark:text-slate-100">{name}</p>
                      {phone && <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Icon d={I.phone} size={13} />{phone}</p>}
                      {email && <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Icon d={I.mail} size={13} />{email}</p>}
                      {nid && <p className="text-slate-400 text-xs">ID: {nid}</p>}
                    </div>
                  </div>
                ) : <p className="text-sm text-slate-400">Not recorded. Add it with Edit.</p>}
              </Card>
            ))}
            {dealer.notes && (
              <Card className="p-5 border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
                <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Admin Note</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{dealer.notes}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{dealer.staff.length} staff login{dealer.staff.length !== 1 ? "s" : ""}</p>
            <button onClick={() => setModal("staff")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold"><Icon d={I.plus} size={15} /> Add Staff</button>
          </div>
          {issued && <TempPasswordNotice email={issued.email} password={issued.password} onDismiss={() => setIssued(null)} />}
          {dealer.staff.length === 0 ? <Card className="p-12 text-center text-sm text-slate-400">No staff logins yet.</Card> : dealer.staff.map((s) => (
            <Card key={s.id} className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={s.name} size="sm" color={s.status === "active" ? "emerald" : "slate"} />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.job_title ?? "Staff"} · {s.email} · {s.last_login_at ? `last sign-in ${longDate(s.last_login_at)}` : "never signed in"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={s.status} />
                <button onClick={() => toggleStaff(s)} className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg">{s.status === "active" ? "Suspend" : "Reinstate"}</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "fleet" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">The dealer manages vehicles from their Fleet page. This is a live breakdown.</p>
          {dealer.fleet_breakdown.length === 0 ? <Card className="p-12 text-center text-sm text-slate-400">No vehicles listed yet.</Card> : dealer.fleet_breakdown.map((f) => {
            const pct = f.count ? Math.round((f.rented / f.count) * 100) : 0;
            return (
              <Card key={f.type} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div><p className="font-black text-slate-900 dark:text-slate-100">{f.type}</p><p className="text-sm text-slate-500 dark:text-slate-400">{f.rented} out on rental / {f.count} total</p></div>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-blue-500" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4 max-w-lg">
          <Card className="p-6 space-y-4">
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Dealer Settings</h4>
            <button onClick={() => setModal("edit")} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left">
              <div><p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Edit Dealer Profile</p><p className="text-xs text-slate-500 mt-0.5">Contacts, tier, license and notes</p></div>
              <Icon d={I.chevron} size={16} className="text-slate-400" />
            </button>
          </Card>
          <Card className="p-6 border-rose-200 dark:border-rose-900/50">
            <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3">Danger Zone</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Delete this dealer and its vehicles. Only possible when it has no booking history; otherwise suspend it.</p>
            <button onClick={remove} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-sm font-bold"><Icon d={I.trash} size={15} /> Delete Dealer</button>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {modal === "edit" && <Modal title="Edit Dealer" onClose={() => setModal(null)} wide><DealerFormView initial={dealer} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); onChanged(); }} /></Modal>}
        {modal === "staff" && <Modal title="Add Staff Login" onClose={() => setModal(null)}><StaffForm dealerId={dealer.id} onClose={() => setModal(null)} onCreated={(s, password) => { setModal(null); setIssued({ email: s.email, password }); reload(); }} /></Modal>}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main list ──────────────────────────────────────────────────────────────
interface DealerList {
  data: AdminDealer[];
  summary: { total: number; active: number; suspended: number; vehicles: number };
}

export default function DealersManagement() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const term = useDebounced(search.trim());
  const query = new URLSearchParams({ status: filterStatus, ...(term && { search: term }) });
  const { data, loading, error, reload } = useApi<DealerList>(`/api/admin/dealers?${query}`);
  const dealers = data?.data ?? [];
  const summary = data?.summary;

  if (selectedId) return <DealerDetail dealerId={selectedId} onBack={() => setSelectedId(null)} onChanged={reload} />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Dealerships</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Onboarded partners, their contacts and standing.</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25"><Icon d={I.plus} size={16} /> Onboard Dealer</button>
      </motion.div>

      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Dealers", value: summary?.total, icon: I.building, bg: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
          { label: "Active", value: summary?.active, icon: I.check, bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" },
          { label: "Suspended", value: summary?.suspended, icon: I.alert, bg: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" },
          { label: "Total Fleet", value: summary?.vehicles, icon: I.car, bg: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" },
        ].map(({ label, value, icon, bg }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><Icon d={icon} size={20} /></div>
            <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">{value ?? "—"}</p></div>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={fade} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon d={I.search} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search dealers" placeholder="Search dealers, cities, owners…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Pending", "Suspended"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} aria-pressed={filterStatus === s}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${filterStatus === s ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>{s}</button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fade}>
        <Card className="overflow-hidden">
          <LoadState loading={loading} error={error} onRetry={reload} empty={dealers.length === 0 && "No dealers match."}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Dealership", "Location", "Owner", "Fleet", "Revenue (MTD)", "Tier", "Status", ""].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dealers.map((dealer) => (
                    <tr key={dealer.id} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={dealer.name} size="sm" />
                          <div>
                            <button onClick={() => setSelectedId(dealer.id)} className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-blue-600 text-left">{dealer.name}</button>
                            <p className="text-[10px] text-slate-400 mt-0.5">{dealer.reference}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{dealer.city}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{dealer.owner_name ?? "—"}</p>
                        <p className="text-[10px] text-slate-400">{dealer.owner_phone}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{dealer.vehicle_count}<span className="block text-[10px] font-medium text-slate-400">{dealer.active_rentals} out</span></td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{ksh(dealer.revenue_this_month)}</td>
                      <td className="px-5 py-4"><TierBadge tier={dealer.tier} /></td>
                      <td className="px-5 py-4"><Badge status={dealer.status} /></td>
                      <td className="px-5 py-4">
                        <button onClick={() => setSelectedId(dealer.id)} className="p-1.5 text-slate-400 hover:text-blue-500" title="View details" aria-label={`View ${dealer.name}`}><Icon d={I.eye} size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LoadState>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">Showing {dealers.length} of {summary?.total ?? 0} dealers</div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {creating && <Modal title="Onboard New Dealer" onClose={() => setCreating(false)} wide><DealerFormView initial={null} onClose={() => setCreating(false)} onSaved={(d) => { setCreating(false); reload(); setSelectedId(d.id); }} /></Modal>}
      </AnimatePresence>
    </motion.div>
  );
}
