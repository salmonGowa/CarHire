import { useState, type ReactNode, type SVGProps } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";

// ─── Icons (inline SVG to avoid import issues) ───────────────────────────────
type IconPath = string | (string | SVGProps<SVGCircleElement>)[];

const Icon = ({ d, size = 20, strokeWidth = 1.8, className = "" }: { d: IconPath; size?: number; strokeWidth?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => typeof p === "string" ? <path key={i} d={p} /> : <circle key={i} {...p} />) : <path d={d} />}
  </svg>
);

// ─── Seed Data ────────────────────────────────────────────────────────────────
const INITIAL_DEALERS = [
  {
    id: "DLR-101", name: "Premier Auto Group", location: "Mombasa", county: "Mombasa County",
    address: "Nyali Business Park, Links Road", phone: "+254 712 345 678", email: "ops@premierauto.co.ke",
    website: "www.premierauto.co.ke", joined: "Oct 2023", status: "Active", fleet: 142, tier: "Platinum",
    licenseNo: "KE-DLR-2023-0041", taxPin: "P051234567X",
    owner: { name: "James Mutuku", phone: "+254 722 111 222", email: "jmutuku@premierauto.co.ke", national_id: "27834910", photo: "JM" },
    manager: { name: "Grace Wanjiku", phone: "+254 733 222 333", email: "gwanjiku@premierauto.co.ke", national_id: "32109876" },
    staff: [
      { id: "S-01", name: "Brian Otieno", role: "Sales Agent", status: "Active", joined: "Nov 2023" },
      { id: "S-02", name: "Faith Njeri", role: "Fleet Coordinator", status: "Active", joined: "Jan 2024" },
      { id: "S-03", name: "Kelvin Mwangi", role: "Mechanic", status: "On Leave", joined: "Dec 2023" },
      { id: "S-04", name: "Susan Achieng", role: "Accounts Officer", status: "Active", joined: "Oct 2023" },
    ],
    fleetBreakdown: [
      { type: "Sedans", count: 55, active: 48 },
      { type: "SUVs", count: 42, active: 39 },
      { type: "Minivans", count: 28, active: 25 },
      { type: "Pickups", count: 17, active: 15 },
    ],
    notes: "Top-performing dealer. Eligible for Q1 incentive bonus.",
  },
  {
    id: "DLR-102", name: "Swift Car Hire Ltd", location: "Nairobi", county: "Nairobi County",
    address: "Upper Hill, Mamlaka Road", phone: "+254 703 456 789", email: "info@swiftcarhire.co.ke",
    website: "www.swiftcarhire.co.ke", joined: "Sep 2023", status: "Active", fleet: 85, tier: "Gold",
    licenseNo: "KE-DLR-2023-0035", taxPin: "P052345678Y",
    owner: { name: "Patricia Kamau", phone: "+254 711 333 444", email: "pkamau@swiftcarhire.co.ke", national_id: "19283746", photo: "PK" },
    manager: { name: "David Omondi", phone: "+254 744 555 666", email: "domondi@swiftcarhire.co.ke", national_id: "21987654" },
    staff: [
      { id: "S-05", name: "Moses Kiprotich", role: "Sales Agent", status: "Active", joined: "Sep 2023" },
      { id: "S-06", name: "Anne Waweru", role: "Fleet Coordinator", status: "Active", joined: "Oct 2023" },
    ],
    fleetBreakdown: [
      { type: "Sedans", count: 30, active: 28 },
      { type: "SUVs", count: 35, active: 32 },
      { type: "Minivans", count: 20, active: 18 },
    ],
    notes: "Consistent performer. Renewal due March 2025.",
  },
  {
    id: "DLR-103", name: "Rift Valley Motors", location: "Nakuru", county: "Nakuru County",
    address: "Kenyatta Avenue, Nakuru Town", phone: "+254 720 789 012", email: "admin@riftmotors.co.ke",
    website: "", joined: "Aug 2023", status: "Suspended", fleet: 32, tier: "Silver",
    licenseNo: "KE-DLR-2023-0028", taxPin: "P053456789Z",
    owner: { name: "Robert Cheruiyot", phone: "+254 700 777 888", email: "rcheruiyot@riftmotors.co.ke", national_id: "15647382", photo: "RC" },
    manager: { name: "Alice Koech", phone: "+254 755 888 999", email: "akoech@riftmotors.co.ke", national_id: "18765432" },
    staff: [
      { id: "S-07", name: "Jared Langat", role: "Sales Agent", status: "Inactive", joined: "Aug 2023" },
    ],
    fleetBreakdown: [
      { type: "Sedans", count: 18, active: 10 },
      { type: "SUVs", count: 14, active: 8 },
    ],
    notes: "Suspended pending compliance review. Contact legal.",
  },
];

type Dealer = (typeof INITIAL_DEALERS)[number];
type Staff = Dealer["staff"][number];
type FleetItem = Dealer["fleetBreakdown"][number];

const TIER_COLORS: Record<string, string> = { Platinum: "text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800", Gold: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800", Silver: "text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Badge = ({ status }: { status: string }) => {
  const map: Record<string, string> = { Active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800", Suspended: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800", Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800", "On Leave": "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800", Inactive: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.Inactive}`}>{status}</span>;
};

const Avatar = ({ initials, size = "md", color = "blue" }: { initials: string; size?: "sm" | "md" | "lg"; color?: string }) => {
  const sz = size === "lg" ? "w-16 h-16 text-lg" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const colors: Record<string, string> = { blue: "from-blue-500 to-blue-700", violet: "from-violet-500 to-violet-700", emerald: "from-emerald-500 to-emerald-700", rose: "from-rose-500 to-rose-700" };
  return <div className={`${sz} rounded-xl bg-gradient-to-br ${colors[color]} text-white font-black flex items-center justify-center flex-shrink-0`}>{initials}</div>;
};

const Card = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm ${className}`}>{children}</div>
);

interface FieldProps {
  label: ReactNode;
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
}

const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, className = "" }: FieldProps & { type?: string; placeholder?: string; required?: boolean }) => (
  <div className={className}>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
  </div>
);

const Select = ({ label, value, onChange, options, className = "" }: FieldProps & { options: { value: string; label: string }[] }) => (
  <div className={className}>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const fade: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide = false }: { title: ReactNode; onClose: () => void; children?: ReactNode; wide?: boolean }) => (
  <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-white dark:bg-[#0B1120] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#0B1120] z-10">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Icon d="M18 6L6 18M6 6l12 12" size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
const Confirm = ({ message, onConfirm, onCancel, danger = true }: { message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) => (
  <Modal title={danger ? "⚠️ Confirm Action" : "Confirm"} onClose={onCancel}>
    <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
      <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${danger ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-600 hover:bg-blue-500"}`}>Confirm</button>
    </div>
  </Modal>
);

// ─── DEALER FORM ──────────────────────────────────────────────────────────────
const emptyDealer = (): Dealer => ({
  id: `DLR-${Math.floor(100 + Math.random() * 900)}`, name: "", location: "", county: "", address: "", phone: "", email: "", website: "",
  joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  status: "Active", fleet: 0, tier: "Silver", licenseNo: "", taxPin: "",
  owner: { name: "", phone: "", email: "", national_id: "", photo: "" },
  manager: { name: "", phone: "", email: "", national_id: "" },
  staff: [], fleetBreakdown: [], notes: "",
});

interface FormProps<T> {
  initial?: T | null;
  onSave: (value: T) => void;
  onClose: () => void;
}

const DealerForm = ({ initial = null, onSave, onClose }: FormProps<Dealer>) => {
  const [form, setForm] = useState<Dealer>(initial ? JSON.parse(JSON.stringify(initial)) : emptyDealer());
  const set = (path: string[], val: unknown) => {
    const clone = JSON.parse(JSON.stringify(form));
    path.reduce<Record<string, unknown>>((obj, k, i) => {
      if (i === path.length - 1) obj[k] = val;
      return obj[k] as Record<string, unknown>;
    }, clone);
    setForm(clone);
  };
  const isEdit = !!initial;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Dealership Name" value={form.name} onChange={v => set(["name"], v)} required className="col-span-2" />
        <Input label="City / Town" value={form.location} onChange={v => set(["location"], v)} required />
        <Input label="County" value={form.county} onChange={v => set(["county"], v)} />
        <Input label="Address" value={form.address} onChange={v => set(["address"], v)} className="col-span-2" />
        <Input label="Phone" value={form.phone} onChange={v => set(["phone"], v)} type="tel" />
        <Input label="Email" value={form.email} onChange={v => set(["email"], v)} type="email" />
        <Input label="Website" value={form.website} onChange={v => set(["website"], v)} placeholder="www.example.co.ke" />
        <Input label="Fleet Capacity" value={form.fleet} onChange={v => set(["fleet"], Number(v))} type="number" />
        <Input label="License No." value={form.licenseNo} onChange={v => set(["licenseNo"], v)} />
        <Input label="Tax PIN" value={form.taxPin} onChange={v => set(["taxPin"], v)} />
        <Select label="Tier" value={form.tier} onChange={v => set(["tier"], v)} options={[{ value: "Silver", label: "Silver" }, { value: "Gold", label: "Gold" }, { value: "Platinum", label: "Platinum" }]} />
        <Select label="Status" value={form.status} onChange={v => set(["status"], v)} options={[{ value: "Active", label: "Active" }, { value: "Suspended", label: "Suspended" }, { value: "Pending", label: "Pending" }]} />
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Owner Details</p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={form.owner.name} onChange={v => set(["owner", "name"], v)} required className="col-span-2" />
          <Input label="Phone" value={form.owner.phone} onChange={v => set(["owner", "phone"], v)} type="tel" />
          <Input label="Email" value={form.owner.email} onChange={v => set(["owner", "email"], v)} type="email" />
          <Input label="National ID" value={form.owner.national_id} onChange={v => set(["owner", "national_id"], v)} className="col-span-2" />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Branch Manager</p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={form.manager.name} onChange={v => set(["manager", "name"], v)} className="col-span-2" />
          <Input label="Phone" value={form.manager.phone} onChange={v => set(["manager", "phone"], v)} type="tel" />
          <Input label="Email" value={form.manager.email} onChange={v => set(["manager", "email"], v)} type="email" />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Admin Notes</label>
        <textarea value={form.notes} onChange={e => set(["notes"], e.target.value)} rows={3} placeholder="Internal notes (not visible to dealer)..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all resize-none" />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        <button onClick={() => onSave(form)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
          {isEdit ? "Save Changes" : "Onboard Dealer"}
        </button>
      </div>
    </div>
  );
};

// ─── STAFF FORM ───────────────────────────────────────────────────────────────
const StaffForm = ({ initial = null, onSave, onClose }: FormProps<Staff>) => {
  const [form, setForm] = useState<Staff>(initial || { id: `S-${Date.now()}`, name: "", role: "", status: "Active", joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }) });
  return (
    <div className="space-y-4">
      <Input label="Full Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
      <Input label="Role / Position" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} required />
      <Select label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))} options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "On Leave", label: "On Leave" }]} />
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        <button onClick={() => onSave(form)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
          {initial ? "Save Changes" : "Add Staff"}
        </button>
      </div>
    </div>
  );
};

// ─── FLEET FORM ───────────────────────────────────────────────────────────────
const FleetForm = ({ initial = null, onSave, onClose }: FormProps<FleetItem>) => {
  const [form, setForm] = useState<FleetItem>(initial || { type: "", count: 0, active: 0 });
  return (
    <div className="space-y-4">
      <Input label="Vehicle Type" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} placeholder="e.g. Sedans, SUVs…" required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Total Count" value={form.count} onChange={v => setForm(f => ({ ...f, count: Number(v) }))} type="number" />
        <Input label="Active Units" value={form.active} onChange={v => setForm(f => ({ ...f, active: Number(v) }))} type="number" />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        <button onClick={() => onSave(form)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">{initial ? "Update" : "Add Category"}</button>
      </div>
    </div>
  );
};

// ─── DEALER DETAIL PAGE ───────────────────────────────────────────────────────
type DetailModal =
  | { type: "edit_dealer" | "confirm_status" | "confirm_delete_dealer" | "add_staff" | "add_fleet" }
  | { type: "edit_staff" | "confirm_delete_staff"; payload: Staff }
  | { type: "edit_fleet" | "confirm_delete_fleet"; payload: FleetItem };

interface DealerDetailProps {
  dealer: Dealer;
  onBack: () => void;
  onUpdate: (dealer: Dealer) => void;
  onDelete: (id: string) => void;
}

const DealerDetail = ({ dealer: initialDealer, onBack, onUpdate, onDelete }: DealerDetailProps) => {
  const [dealer, setDealer] = useState(initialDealer);
  const [modal, setModal] = useState<DetailModal | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const save = (updated: Dealer) => { setDealer(updated); onUpdate(updated); };

  const totalFleet = dealer.fleetBreakdown.reduce((s, f) => s + f.count, 0);
  const activeFleet = dealer.fleetBreakdown.reduce((s, f) => s + f.active, 0);
  const utilizationPct = totalFleet > 0 ? Math.round((activeFleet / totalFleet) * 100) : 0;

  const handleStatusToggle = () => {
    const newStatus = dealer.status === "Active" ? "Suspended" : "Active";
    const updated = { ...dealer, status: newStatus };
    save(updated);
    setModal(null);
  };

  const handleDeleteDealer = () => { onDelete(dealer.id); setModal(null); };

  // Staff CRUD
  const saveStaff = (staff: Staff) => {
    const editing = modal?.type === "edit_staff" ? modal.payload : null;
    const list = editing
      ? dealer.staff.map(s => s.id === editing.id ? staff : s)
      : [...dealer.staff, staff];
    save({ ...dealer, staff: list });
    setModal(null);
  };
  const deleteStaff = (id: string) => { save({ ...dealer, staff: dealer.staff.filter(s => s.id !== id) }); setModal(null); };

  // Fleet CRUD
  const saveFleet = (item: FleetItem) => {
    const editing = modal?.type === "edit_fleet" ? modal.payload : null;
    const list = editing
      ? dealer.fleetBreakdown.map(f => f.type === editing.type ? item : f)
      : [...dealer.fleetBreakdown, item];
    save({ ...dealer, fleetBreakdown: list });
    setModal(null);
  };
  const deleteFleet = (type: string) => { save({ ...dealer, fleetBreakdown: dealer.fleetBreakdown.filter(f => f.type !== type) }); setModal(null); };

  const TABS = ["overview", "staff", "fleet", "settings"];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <Icon d="M19 12H5M5 12l7-7M5 12l7 7" size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{dealer.name}</h2>
              <Badge status={dealer.status} />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${TIER_COLORS[dealer.tier]}`}>{dealer.tier}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dealer.id} · {dealer.address}, {dealer.county}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setModal({ type: "edit_dealer" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={15} /> Edit
          </button>
          <button onClick={() => setModal({ type: "confirm_status" })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 shadow-md ${dealer.status === "Active" ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"}`}>
            <Icon d={dealer.status === "Active" ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} size={15} />
            {dealer.status === "Active" ? "Suspend" : "Reinstate"}
          </button>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Fleet", value: totalFleet, icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM3 7h18M3 7l1-4h16l1 4M3 7v7a2 2 0 002 2h1M21 7v7a2 2 0 01-2 2h-1", color: "blue" },
          { label: "Active Units", value: activeFleet, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald" },
          { label: "Utilization", value: `${utilizationPct}%`, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "violet" },
          { label: "Staff Count", value: dealer.staff.length, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "amber" },
        ].map(({ label, value, icon, color }) => {
          const bg = ({ blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400", amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" } as Record<string, string>)[color];
          return (
            <Card key={label} className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><Icon d={icon} size={20} /></div>
              <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">{value}</p></div>
            </Card>
          );
        })}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fade} className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold capitalize transition-all ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600 -mb-px" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            {tab}
          </button>
        ))}
      </motion.div>

      {/* ── Overview Tab ── */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Info */}
            <motion.div variants={fade}>
              <Card className="p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Contact & Legal</h4>
                {[
                  { label: "Phone", value: dealer.phone, icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
                  { label: "Email", value: dealer.email, icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                  { label: "Website", value: dealer.website || "—", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" },
                  { label: "License No.", value: dealer.licenseNo, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                  { label: "Tax PIN", value: dealer.taxPin, icon: "M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M16 5h3m0 0v3m0-3L9 16" },
                  { label: "Joined", value: dealer.joined, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500 dark:text-slate-400"><Icon d={icon} size={15} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </motion.div>

            {/* Owner + Manager */}
            <motion.div variants={fade} className="space-y-4">
              <Card className="p-6">
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">Owner</h4>
                <div className="flex items-start gap-4">
                  <Avatar initials={dealer.owner.photo || dealer.owner.name.split(" ").map(n=>n[0]).join("")} size="lg" color="blue" />
                  <div className="space-y-1.5 text-sm">
                    <p className="font-black text-slate-900 dark:text-slate-100 text-base">{dealer.owner.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Icon d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={13} />{dealer.owner.phone}</p>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={13} />{dealer.owner.email}</p>
                    <p className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5 text-xs"><Icon d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" size={13} />ID: {dealer.owner.national_id}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">Branch Manager</h4>
                <div className="flex items-start gap-4">
                  <Avatar initials={dealer.manager.name.split(" ").map(n=>n[0]).join("").substring(0,2)} size="md" color="emerald" />
                  <div className="space-y-1.5 text-sm">
                    <p className="font-black text-slate-900 dark:text-slate-100">{dealer.manager.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Icon d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={13} />{dealer.manager.phone}</p>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={13} />{dealer.manager.email}</p>
                  </div>
                </div>
              </Card>
              {dealer.notes && (
                <Card className="p-5 border-l-4 border-l-amber-400 dark:border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Admin Note</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{dealer.notes}</p>
                </Card>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── Staff Tab ── */}
        {activeTab === "staff" && (
          <motion.div key="staff" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            <motion.div variants={fade} className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{dealer.staff.length} staff member{dealer.staff.length !== 1 ? "s" : ""}</p>
              <button onClick={() => setModal({ type: "add_staff" })} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                <Icon d="M12 5v14m-7-7h14" size={15} /> Add Staff
              </button>
            </motion.div>
            {dealer.staff.length === 0 ? (
              <motion.div variants={fade}><Card className="p-12 text-center"><Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" /><p className="text-slate-400 dark:text-slate-500 text-sm">No staff members yet</p></Card></motion.div>
            ) : dealer.staff.map((s) => (
              <motion.div key={s.id} variants={fade}>
                <Card className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={s.name.split(" ").map(n=>n[0]).join("").substring(0,2)} size="sm" color={s.status === "Active" ? "emerald" : s.status === "On Leave" ? "amber" : "rose"} />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{s.role} · Joined {s.joined}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={s.status} />
                    <button onClick={() => setModal({ type: "edit_staff", payload: s })} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={15} /></button>
                    <button onClick={() => setModal({ type: "confirm_delete_staff", payload: s })} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={15} /></button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Fleet Tab ── */}
        {activeTab === "fleet" && (
          <motion.div key="fleet" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            <motion.div variants={fade} className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{dealer.fleetBreakdown.length} vehicle categor{dealer.fleetBreakdown.length !== 1 ? "ies" : "y"}</p>
              <button onClick={() => setModal({ type: "add_fleet" })} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                <Icon d="M12 5v14m-7-7h14" size={15} /> Add Category
              </button>
            </motion.div>
            {dealer.fleetBreakdown.length === 0 ? (
              <motion.div variants={fade}><Card className="p-12 text-center"><p className="text-slate-400 dark:text-slate-500 text-sm">No fleet categories yet</p></Card></motion.div>
            ) : dealer.fleetBreakdown.map((f) => {
              const pct = f.count > 0 ? Math.round((f.active / f.count) * 100) : 0;
              return (
                <motion.div key={f.type} variants={fade}>
                  <Card className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="font-black text-slate-900 dark:text-slate-100">{f.type}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{f.active} active / {f.count} total</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{pct}%</span>
                        <button onClick={() => setModal({ type: "edit_fleet", payload: f })} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={15} /></button>
                        <button onClick={() => setModal({ type: "confirm_delete_fleet", payload: f })} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={15} /></button>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${pct > 75 ? "bg-emerald-500" : pct > 40 ? "bg-amber-500" : "bg-rose-500"}`} />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === "settings" && (
          <motion.div key="settings" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4 max-w-lg">
            <motion.div variants={fade}>
              <Card className="p-6 space-y-4">
                <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Dealer Settings</h4>
                <button onClick={() => setModal({ type: "edit_dealer" })} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                  <div><p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Edit Dealer Profile</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update all dealer information and contacts</p></div>
                  <Icon d="M9 5l7 7-7 7" size={16} className="text-slate-400" />
                </button>
                <button onClick={() => setModal({ type: "confirm_status" })} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{dealer.status === "Active" ? "Suspend Dealer" : "Reinstate Dealer"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Current status: <span className={dealer.status === "Active" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{dealer.status}</span></p>
                  </div>
                  <Icon d="M9 5l7 7-7 7" size={16} className="text-slate-400" />
                </button>
              </Card>
            </motion.div>
            <motion.div variants={fade}>
              <Card className="p-6 border-rose-200 dark:border-rose-900/50">
                <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3">Danger Zone</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Permanently delete this dealer and all associated data. This action cannot be undone.</p>
                <button onClick={() => setModal({ type: "confirm_delete_dealer" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                  <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={15} /> Delete Dealer
                </button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      {modal?.type === "edit_dealer" && <Modal title="Edit Dealer" onClose={() => setModal(null)} wide><DealerForm initial={dealer} onSave={d => { save(d); setModal(null); }} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "add_staff" && <Modal title="Add Staff Member" onClose={() => setModal(null)}><StaffForm onSave={saveStaff} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "edit_staff" && <Modal title="Edit Staff Member" onClose={() => setModal(null)}><StaffForm initial={modal.payload} onSave={saveStaff} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "add_fleet" && <Modal title="Add Fleet Category" onClose={() => setModal(null)}><FleetForm onSave={saveFleet} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "edit_fleet" && <Modal title="Edit Fleet Category" onClose={() => setModal(null)}><FleetForm initial={modal.payload} onSave={saveFleet} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "confirm_status" && <Confirm message={`Are you sure you want to ${dealer.status === "Active" ? "suspend" : "reinstate"} ${dealer.name}? ${dealer.status === "Active" ? "This will revoke their platform access immediately." : "This will restore full platform access."}`} onConfirm={handleStatusToggle} onCancel={() => setModal(null)} danger={dealer.status === "Active"} />}
      {modal?.type === "confirm_delete_dealer" && <Confirm message={`Permanently delete ${dealer.name} (${dealer.id})? This will remove all associated staff and fleet data.`} onConfirm={handleDeleteDealer} onCancel={() => setModal(null)} danger />}
      {modal?.type === "confirm_delete_staff" && <Confirm message={`Remove ${modal.payload?.name} from ${dealer.name}?`} onConfirm={() => deleteStaff(modal.payload.id)} onCancel={() => setModal(null)} danger />}
      {modal?.type === "confirm_delete_fleet" && <Confirm message={`Delete the "${modal.payload?.type}" fleet category? This cannot be undone.`} onConfirm={() => deleteFleet(modal.payload.type)} onCancel={() => setModal(null)} danger />}
    </motion.div>
  );
};

// ─── MAIN DEALERS LIST ────────────────────────────────────────────────────────
export default function DealersManagement() {
  const [dealers, setDealers] = useState(INITIAL_DEALERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: "add_dealer" } | { type: "edit_dealer" | "confirm_delete"; payload: Dealer } | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const selectedDealer = dealers.find(d => d.id === selectedId);
  if (selectedDealer) {
    return (
      <DealerDetail
        dealer={selectedDealer}
        onBack={() => setSelectedId(null)}
        onUpdate={updated => setDealers(ds => ds.map(d => d.id === updated.id ? updated : d))}
        onDelete={id => { setDealers(ds => ds.filter(d => d.id !== id)); setSelectedId(null); }}
      />
    );
  }

  const filtered = dealers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.owner.name.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const total = dealers.length;
  const active = dealers.filter(d => d.status === "Active").length;
  const suspended = dealers.filter(d => d.status === "Suspended").length;
  const totalFleet = dealers.reduce((s, d) => s + d.fleet, 0);

  const addDealer = (form: Dealer) => { setDealers(ds => [...ds, form]); setModal(null); };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Dealerships</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage onboarded partners and branches.</p>
        </div>
        <button onClick={() => setModal({ type: "add_dealer" })} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
          <Icon d="M12 5v14m-7-7h14" size={16} /> Onboard Dealer
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Dealers", value: total, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "blue" },
          { label: "Active", value: active, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald" },
          { label: "Suspended", value: suspended, icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "rose" },
          { label: "Total Fleet", value: totalFleet.toLocaleString(), icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM3 7h18M3 7l1-4h16l1 4M3 7v7a2 2 0 002 2h1M21 7v7a2 2 0 01-2 2h-1", color: "violet" },
        ].map(({ label, value, icon, color }) => {
          const bg = ({ blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400", violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" } as Record<string, string>)[color];
          return (
            <Card key={label} className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><Icon d={icon} size={20} /></div>
              <div><p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">{value}</p></div>
            </Card>
          );
        })}
      </motion.div>

      {/* Search + Filter */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dealers, locations, owners…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all" />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Suspended"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${filterStatus === s ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fade}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {["Dealership", "Location", "Owner", "Fleet", "Tier", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">No dealers found matching your search.</td></tr>
                  ) : filtered.map((dealer, i) => (
                    <motion.tr key={dealer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar initials={dealer.name.split(" ").map(n=>n[0]).join("").substring(0,2)} size="sm" color="blue" />
                          <div>
                            <button onClick={() => setSelectedId(dealer.id)} className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left">{dealer.name}</button>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{dealer.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{dealer.location}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{dealer.owner.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{dealer.owner.phone}</p>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{dealer.fleet}</td>
                      <td className="px-5 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${TIER_COLORS[dealer.tier]}`}>{dealer.tier}</span></td>
                      <td className="px-5 py-4"><Badge status={dealer.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedId(dealer.id)} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="View details"><Icon d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" size={15} /></button>
                          <button onClick={() => setModal({ type: "edit_dealer", payload: dealer })} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="Edit"><Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" size={15} /></button>
                          <button onClick={() => setModal({ type: "confirm_delete", payload: dealer })} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Delete"><Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={15} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500">Showing {filtered.length} of {total} dealers</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Super Admin · Read/Write Access</p>
          </div>
        </Card>
      </motion.div>

      {/* List-level modals */}
      {modal?.type === "add_dealer" && <Modal title="Onboard New Dealer" onClose={() => setModal(null)} wide><DealerForm onSave={addDealer} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "edit_dealer" && <Modal title="Edit Dealer" onClose={() => setModal(null)} wide><DealerForm initial={modal.payload} onSave={d => { setDealers(ds => ds.map(x => x.id === d.id ? d : x)); setModal(null); }} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "confirm_delete" && <Confirm message={`Permanently delete ${modal.payload?.name}? This will remove all data for this dealership.`} onConfirm={() => { setDealers(ds => ds.filter(d => d.id !== modal.payload.id)); setModal(null); }} onCancel={() => setModal(null)} danger />}
    </motion.div>
  );
}