import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, CheckCircle2, ShieldAlert, Clock, CreditCard,
  UserPlus, ArrowLeft, Edit3, Trash2, Mail, Phone, MapPin, Calendar,
  Car, Smartphone, Activity, Flag, ShieldCheck, XCircle, FileText,
  Building2, ChevronRight, AlertCircle, Eye,
  User
} from "lucide-react";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const INITIAL_CLIENTS = [
  {
    id: "USR-00412", name: "James Mwangi", email: "james@example.com",
    phone: "+254 712 345 678", altPhone: "+254 700 111 222",
    joined: "Jan 2023", dob: "1988-04-12", gender: "Male",
    nationalId: "27834910", kraPin: "A001234567B",
    address: "Westlands, Nairobi", county: "Nairobi",
    ltv: 145000, bookings: 12, status: "Active", kyc: "Verified",
    kycDate: "Feb 2023", kycReviewer: "Admin Grace",
    kycDocs: ["National ID", "Selfie", "Proof of Address"],
    tier: "Gold", creditScore: 87, notes: "VIP client. Preferred contact via phone.",
    flagged: false,
    bookingHistory: [
      { id: "BK-1021", vehicle: "Toyota Prado – KCB 441Z", dealer: "Premier Auto", date: "Mar 2024", amount: 18500, status: "Completed" },
      { id: "BK-1008", vehicle: "Nissan X-Trail – KDA 221B", dealer: "Swift Car Hire", date: "Jan 2024", amount: 14000, status: "Completed" },
      { id: "BK-0992", vehicle: "Toyota Camry – KBZ 019F", dealer: "Premier Auto", date: "Nov 2023", amount: 12000, status: "Completed" },
    ],
    payments: [
      { id: "PAY-881", amount: 18500, method: "M-Pesa", date: "Mar 2024", status: "Cleared" },
      { id: "PAY-830", amount: 14000, method: "Card", date: "Jan 2024", status: "Cleared" },
    ],
    activityLog: [
      { action: "KYC Verified", by: "Admin Grace", date: "Feb 2023" },
      { action: "Account Created", by: "System", date: "Jan 2023" },
    ],
  },
  {
    id: "USR-00413", name: "Sarah Wanjiku", email: "sarah@example.com",
    phone: "+254 722 999 888", altPhone: "",
    joined: "Mar 2023", dob: "1995-09-22", gender: "Female",
    nationalId: "35291047", kraPin: "A009876543C",
    address: "Kilimani, Nairobi", county: "Nairobi",
    ltv: 32000, bookings: 3, status: "Active", kyc: "Pending",
    kycDate: null, kycReviewer: null,
    kycDocs: ["National ID"],
    tier: "Silver", creditScore: 62, notes: "",
    flagged: false,
    bookingHistory: [
      { id: "BK-1034", vehicle: "Honda CR-V – KCD 880T", dealer: "Swift Car Hire", date: "Apr 2024", amount: 10500, status: "Active" },
      { id: "BK-1019", vehicle: "Toyota Corolla – KBX 220L", dealer: "Swift Car Hire", date: "Feb 2024", amount: 8000, status: "Completed" },
    ],
    payments: [
      { id: "PAY-901", amount: 10500, method: "M-Pesa", date: "Apr 2024", status: "Cleared" },
    ],
    activityLog: [
      { action: "KYC Submitted", by: "User", date: "Mar 2023" },
      { action: "Account Created", by: "System", date: "Mar 2023" },
    ],
  },
  {
    id: "USR-00414", name: "David Kipkorir", email: "david@example.com",
    phone: "+254 733 444 555", altPhone: "",
    joined: "Sep 2023", dob: "1990-01-30", gender: "Male",
    nationalId: "29183746", kraPin: "",
    address: "Nakuru Town, Nakuru", county: "Nakuru",
    ltv: 0, bookings: 0, status: "Suspended", kyc: "Rejected",
    kycDate: "Oct 2023", kycReviewer: "Admin Brian",
    kycDocs: ["National ID"],
    tier: "Bronze", creditScore: 20, notes: "KYC rejected — ID mismatch. Account suspended pending review.",
    flagged: true,
    bookingHistory: [],
    payments: [],
    activityLog: [
      { action: "Account Suspended", by: "Admin Brian", date: "Oct 2023" },
      { action: "KYC Rejected", by: "Admin Brian", date: "Oct 2023" },
      { action: "KYC Submitted", by: "User", date: "Sep 2023" },
      { action: "Account Created", by: "System", date: "Sep 2023" },
    ],
  },
  {
    id: "USR-00415", name: "Faith Njeri", email: "faith.njeri@example.com",
    phone: "+254 700 123 456", altPhone: "+254 711 789 012",
    joined: "Dec 2023", dob: "1993-07-15", gender: "Female",
    nationalId: "41029384", kraPin: "A007654321D",
    address: "Thika Road, Ruiru", county: "Kiambu",
    ltv: 58000, bookings: 5, status: "Active", kyc: "Verified",
    kycDate: "Jan 2024", kycReviewer: "Admin Grace",
    kycDocs: ["National ID", "Selfie", "Utility Bill"],
    tier: "Silver", creditScore: 74, notes: "",
    flagged: false,
    bookingHistory: [
      { id: "BK-1044", vehicle: "Mazda CX-5 – KDC 110P", dealer: "Premier Auto", date: "May 2024", amount: 15000, status: "Active" },
    ],
    payments: [
      { id: "PAY-922", amount: 15000, method: "Bank Transfer", date: "May 2024", status: "Cleared" },
    ],
    activityLog: [
      { action: "KYC Verified", by: "Admin Grace", date: "Jan 2024" },
      { action: "Account Created", by: "System", date: "Dec 2023" },
    ],
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const KYC_STYLES = {
  Verified: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  Pending:  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};
const STATUS_STYLES = {
  Active:    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  Suspended: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  Flagged:   "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};
const TIER_STYLES = {
  Gold:    "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Silver:  "text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Bronze:  "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  Platinum:"text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800",
};
const BOOKING_STATUS = {
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  Active:    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};

// ─── Reusables ────────────────────────────────────────────────────────────────
const fade  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm ${className}`}>
    {children}
  </div>
);

const Badge = ({ label, style }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style}`}>{label}</span>
);

const Avatar = ({ name, size = "md", flagged = false }) => {
  const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const sz = { lg: "w-16 h-16 text-xl", md: "w-10 h-10 text-sm", sm: "w-8 h-8 text-xs" }[size];
  const palette = ["from-blue-500 to-cyan-600","from-violet-500 to-purple-700","from-emerald-500 to-teal-600","from-rose-500 to-pink-600","from-amber-500 to-orange-600"];
  const grad = palette[name.charCodeAt(0) % palette.length];
  return (
    <div className={`relative ${sz} rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center font-black text-white shadow-inner flex-shrink-0`}>
      {initials}
      {flagged && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#0B1120] shadow-sm" />}
    </div>
  );
};

const ScoreBar = ({ score }) => {
  const color = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.9, ease: "easeOut" }} className={`h-full rounded-full ${color}`} />
      </div>
      <span className={`text-xs font-black w-6 text-right ${score >= 75 ? "text-emerald-600 dark:text-emerald-400" : score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>{score}</span>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, className = "" }) => (
  <div className={className}>
    {label && <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" />
  </div>
);

const Sel = ({ label, value, onChange, options, className = "" }) => (
  <div className={className}>
    {label && <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none cursor-pointer">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ─── Modal Shell ──────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide = false }) => (
  <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} bg-white dark:bg-[#0B1120] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md z-10">
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const Confirm = ({ message, onConfirm, onCancel, danger = true }) => (
  <Modal title={danger ? "⚠️ Confirm Action" : "Confirm"} onClose={onCancel}>
    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
      <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors shadow-lg ${danger ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20" : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"}`}>Confirm</button>
    </div>
  </Modal>
);

// ─── Client Form ──────────────────────────────────────────────────────────────
const emptyClient = () => ({
  id: `USR-${String(Math.floor(10000 + Math.random() * 90000))}`,
  name: "", email: "", phone: "", altPhone: "", dob: "", gender: "Male",
  nationalId: "", kraPin: "", address: "", county: "",
  joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  ltv: 0, bookings: 0, status: "Active", kyc: "Pending",
  kycDate: null, kycReviewer: null, kycDocs: [],
  tier: "Silver", creditScore: 50, notes: "", flagged: false,
  bookingHistory: [], payments: [], activityLog: [{ action: "Account Created", by: "Admin", date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }) }],
});

const ClientForm = ({ initial = null, onSave, onClose }) => {
  const [form, setForm] = useState(initial ? JSON.parse(JSON.stringify(initial)) : emptyClient());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" value={form.name} onChange={v => set("name", v)} required className="col-span-2" />
        <Input label="Email" value={form.email} onChange={v => set("email", v)} type="email" required />
        <Input label="Phone" value={form.phone} onChange={v => set("phone", v)} type="tel" required />
        <Input label="Alt. Phone" value={form.altPhone} onChange={v => set("altPhone", v)} type="tel" />
        <Input label="Date of Birth" value={form.dob} onChange={v => set("dob", v)} type="date" />
        <Sel label="Gender" value={form.gender} onChange={v => set("gender", v)} options={["Male","Female","Other","Prefer not to say"].map(x=>({value:x,label:x}))} />
        <Input label="National ID" value={form.nationalId} onChange={v => set("nationalId", v)} required />
        <Input label="KRA PIN" value={form.kraPin} onChange={v => set("kraPin", v)} />
        <Input label="Address" value={form.address} onChange={v => set("address", v)} className="col-span-2" />
        <Input label="County" value={form.county} onChange={v => set("county", v)} />
        <Sel label="Tier" value={form.tier} onChange={v => set("tier", v)} options={["Bronze","Silver","Gold","Platinum"].map(x=>({value:x,label:x}))} />
        <Sel label="KYC Status" value={form.kyc} onChange={v => set("kyc", v)} options={["Pending","Verified","Rejected"].map(x=>({value:x,label:x}))} />
        <Sel label="Account Status" value={form.status} onChange={v => set("status", v)} options={["Active","Suspended"].map(x=>({value:x,label:x}))} />
      </div>
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Admin Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Internal notes (not visible to client)..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600" />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        <button onClick={() => onSave(form)} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
          {isEdit ? "Save Changes" : "Create Account"}
        </button>
      </div>
    </div>
  );
};

// ─── KYC Review Modal ────────────────────────────────────────────────────────
const KYCReviewModal = ({ client, onDecision, onClose }) => {
  const [decision, setDecision] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <Avatar name={client.name} size="md" />
        <div>
          <p className="font-black text-slate-900 dark:text-slate-100">{client.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{client.id} · ID: {client.nationalId}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Documents Submitted</p>
        <div className="flex flex-wrap gap-2">
          {client.kycDocs.length ? client.kycDocs.map(doc => (
            <span key={doc} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText size={14} className="text-slate-400" />
              {doc}
            </span>
          )) : <p className="text-xs text-slate-400 dark:text-slate-500">No documents uploaded</p>}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Decision</p>
        <div className="grid grid-cols-2 gap-3">
          {["Verified", "Rejected"].map(d => (
            <button key={d} onClick={() => setDecision(d)}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-bold transition-all ${decision === d
                ? d === "Verified" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"}`}>
              {d === "Verified" ? <><CheckCircle2 size={16} /> Approve</> : <><XCircle size={16} /> Reject</>}
            </button>
          ))}
        </div>
      </div>

      {decision === "Rejected" && (
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Rejection Reason</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="State the reason for rejection..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600" />
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        <button disabled={!decision} onClick={() => onDecision(decision, reason)}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${decision === "Verified" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"}`}>
          Submit Decision
        </button>
      </div>
    </div>
  );
};

// ─── CLIENT DETAIL PAGE ───────────────────────────────────────────────────────
const ClientDetail = ({ client: init, onBack, onUpdate, onDelete }) => {
  const [client, setClient] = useState(init);
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(null);

  const save = (updated) => { setClient(updated); onUpdate(updated); };

  const handleKYCDecision = (decision, reason) => {
    const now = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const updated = {
      ...client, kyc: decision, kycDate: now, kycReviewer: "Super Admin",
      activityLog: [{ action: `KYC ${decision}${reason ? ` — ${reason}` : ""}`, by: "Super Admin", date: now }, ...client.activityLog],
    };
    save(updated); setModal(null);
  };

  const handleToggleStatus = () => {
    const newStatus = client.status === "Active" ? "Suspended" : "Active";
    const now = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const updated = {
      ...client, status: newStatus,
      activityLog: [{ action: `Account ${newStatus === "Active" ? "Reinstated" : "Suspended"}`, by: "Super Admin", date: now }, ...client.activityLog],
    };
    save(updated); setModal(null);
  };

  const handleToggleFlag = () => {
    const now = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const updated = {
      ...client, flagged: !client.flagged,
      activityLog: [{ action: client.flagged ? "Flag Removed" : "Account Flagged", by: "Super Admin", date: now }, ...client.activityLog],
    };
    save(updated);
  };

  const TABS = ["overview", "bookings", "payments", "activity", "settings"];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
            <ArrowLeft size={18} />
          </button>
          <Avatar name={client.name} size="lg" flagged={client.flagged} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{client.name}</h2>
              <Badge label={client.status} style={STATUS_STYLES[client.status]} />
              <Badge label={client.kyc} style={KYC_STYLES[client.kyc]} />
              {client.flagged && <Badge label="Flagged" style={STATUS_STYLES.Flagged} />}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-mono">{client.id} · <span className="font-sans">{client.email}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <button onClick={handleToggleFlag}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${client.flagged ? "border-rose-300 text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-300 hover:text-amber-600 dark:hover:border-amber-700 dark:hover:text-amber-500 bg-white dark:bg-[#0B1120]"}`}>
            <Flag size={16} fill={client.flagged ? "currentColor" : "none"} />
            {client.flagged ? "Unflag" : "Flag"}
          </button>
          <button onClick={() => setModal({ type: "kyc" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-[#0B1120]">
            <ShieldCheck size={16} />
            KYC Review
          </button>
          <button onClick={() => setModal({ type: "edit" })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-[#0B1120]">
            <Edit3 size={16} />
            Edit
          </button>
          <button onClick={() => setModal({ type: "confirm_status" })}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-md ${client.status === "Active" ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20" : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"}`}>
            {client.status === "Active" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            {client.status === "Active" ? "Suspend" : "Reinstate"}
          </button>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Lifetime Value", value: `KSh ${client.ltv.toLocaleString()}`, sub: `${client.bookings} bookings`, color: "blue", icon: CreditCard },
          { label: "Credit Score", value: client.creditScore, sub: client.creditScore >= 75 ? "Excellent" : client.creditScore >= 50 ? "Fair" : "Poor", color: client.creditScore >= 75 ? "emerald" : client.creditScore >= 50 ? "amber" : "rose", icon: Activity },
          { label: "Member Since", value: client.joined, sub: client.county, color: "violet", icon: Calendar },
          { label: "KYC Status", value: client.kyc, sub: client.kycDate ? `Since ${client.kycDate}` : "Not reviewed", color: client.kyc === "Verified" ? "emerald" : client.kyc === "Pending" ? "amber" : "rose", icon: ShieldCheck },
        ].map(({ label, value, sub, color, icon: IconCmp }) => {
          const bg = { blue:"bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", emerald:"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", amber:"bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400", rose:"bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400", violet:"bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" }[color];
          return (
            <Card key={label} className="p-5 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><IconCmp size={20} /></div>
              <div><p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{label}</p><p className="font-black text-slate-900 dark:text-slate-100 leading-none mt-0.5">{value}</p><p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p></div>
            </Card>
          );
        })}
      </motion.div>

      {/* Animated Tabs */}
      <motion.div variants={fade} className="flex gap-6 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`relative pb-3 text-sm font-bold capitalize transition-all ${tab === t ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            {t}
            {tab === t && (
              <motion.div layoutId="activeClientTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── Overview ── */}
        {tab === "overview" && (
          <motion.div key="ov" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={fade}>
              <Card className="p-6 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Personal Details</h4>
                <div className="space-y-4">
                  {[
                    { label: "Full Name", value: client.name, icon: User },
                    { label: "Date of Birth", value: client.dob || "—", icon: Calendar },
                    { label: "Gender", value: client.gender || "—", icon: Users },
                    { label: "Phone", value: client.phone, icon: Phone },
                    { label: "Alt. Phone", value: client.altPhone || "—", icon: Phone },
                    { label: "Email", value: client.email, icon: Mail },
                    { label: "Address", value: `${client.address}, ${client.county}`, icon: MapPin },
                  ].map(({ label, value, icon: IconCmp }) => (
                    <div key={label} className="flex items-center gap-4 group">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all"><IconCmp size={16} /></div>
                      <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</p></div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
            <motion.div variants={fade} className="space-y-4">
              <Card className="p-6 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity & Compliance</h4>
                {[
                  { label: "National ID", value: client.nationalId || "—" },
                  { label: "KRA PIN", value: client.kraPin || "—" },
                  { label: "KYC Status", value: client.kyc },
                  { label: "KYC Date", value: client.kycDate || "Not reviewed" },
                  { label: "Reviewed By", value: client.kycReviewer || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{value}</span>
                  </div>
                ))}
                <div className="pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">KYC Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {client.kycDocs.length ? client.kycDocs.map(d => (
                      <span key={d} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><FileText size={12} className="text-slate-400" /> {d}</span>
                    )) : <span className="text-xs text-slate-400 dark:text-slate-500">None uploaded</span>}
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Score</h4>
                  <Badge label={client.tier} style={TIER_STYLES[client.tier]} />
                </div>
                <ScoreBar score={client.creditScore} />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Based on payment history and activity</p>
              </Card>
              {client.notes && (
                <Card className="p-5 border-l-4 border-l-amber-400 dark:border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Admin Note</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{client.notes}</p>
                </Card>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ── Bookings ── */}
        {tab === "bookings" && (
          <motion.div key="bk" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            {client.bookingHistory.length === 0 ? (
              <motion.div variants={fade}><Card className="p-12 text-center"><Car size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" /><p className="text-slate-400 text-sm">No bookings yet.</p></Card></motion.div>
            ) : client.bookingHistory.map(b => (
              <motion.div key={b.id} variants={fade}>
                <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Car size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{b.vehicle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{b.id} <span className="font-sans">· {b.dealer} · {b.date}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${BOOKING_STATUS[b.status]}`}>{b.status}</span>
                    <p className="font-black text-slate-900 dark:text-slate-100 text-sm">KSh {b.amount.toLocaleString()}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Payments ── */}
        {tab === "payments" && (
          <motion.div key="py" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4">
            {client.payments.length === 0 ? (
              <motion.div variants={fade}><Card className="p-12 text-center"><CreditCard size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" /><p className="text-slate-400 text-sm">No payment records.</p></Card></motion.div>
            ) : client.payments.map(p => (
              <motion.div key={p.id} variants={fade}>
                <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      {p.method === "M-Pesa" ? <Smartphone size={20} /> : <CreditCard size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.method}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{p.id} <span className="font-sans">· {p.date}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{p.status}</span>
                    <p className="font-black text-slate-900 dark:text-slate-100 text-sm">KSh {p.amount.toLocaleString()}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Activity ── */}
        {tab === "activity" && (
          <motion.div key="ac" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }}>
            <Card className="p-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Audit Log</h4>
              <div className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                {client.activityLog.map((log, i) => (
                  <motion.div key={i} variants={fade} className="relative mb-6 last:mb-0 pl-6 group">
                    <div className="absolute left-[-1.15rem] top-1 w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-[#0B1120] group-hover:bg-blue-500 transition-colors" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{log.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">By <span className="font-semibold text-slate-700 dark:text-slate-300">{log.by}</span> · {log.date}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── Settings ── */}
        {tab === "settings" && (
          <motion.div key="st" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-4 max-w-xl">
            <motion.div variants={fade}>
              <Card className="p-6 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Controls</h4>
                {[
                  { label: "Edit Profile", sub: "Update client info, tier, and notes", action: () => setModal({ type: "edit" }), icon: Edit3 },
                  { label: "KYC Review", sub: "Approve or reject identity verification", action: () => setModal({ type: "kyc" }), icon: ShieldCheck },
                  { label: client.status === "Active" ? "Suspend Account" : "Reinstate Account", sub: `Currently: ${client.status}`, action: () => setModal({ type: "confirm_status" }), icon: client.status === "Active" ? XCircle : CheckCircle2 },
                  { label: client.flagged ? "Remove Flag" : "Flag Account", sub: "Mark for compliance review", action: handleToggleFlag, icon: Flag },
                ].map(({ label, sub, action, icon: IconCmp }) => (
                  <button key={label} onClick={action} className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
                        <IconCmp size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
              </Card>
            </motion.div>
            <motion.div variants={fade}>
              <Card className="p-6 border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-900/10">
                <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3">Danger Zone</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">Permanently delete this account and all associated data. This action cannot be undone.</p>
                <button onClick={() => setModal({ type: "confirm_delete" })} className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-sm font-bold hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white transition-all">
                  <ShieldAlert size={16} />
                  Delete Account
                </button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {modal?.type === "edit" && <Modal title="Edit Client Profile" onClose={() => setModal(null)} wide><ClientForm initial={client} onSave={c => { save(c); setModal(null); }} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "kyc" && <Modal title="KYC Review" onClose={() => setModal(null)}><KYCReviewModal client={client} onDecision={handleKYCDecision} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "confirm_status" && <Confirm message={`${client.status === "Active" ? "Suspend" : "Reinstate"} account for ${client.name}? ${client.status === "Active" ? "They will lose platform access immediately." : "They will regain full platform access."}`} onConfirm={handleToggleStatus} onCancel={() => setModal(null)} danger={client.status === "Active"} />}
      {modal?.type === "confirm_delete" && <Confirm message={`Permanently delete account for ${client.name} (${client.id})? All booking history and data will be erased.`} onConfirm={() => { onDelete(client.id); }} onCancel={() => setModal(null)} danger />}
    </motion.div>
  );
};

// ─── MAIN LIST ────────────────────────────────────────────────────────────────
export default function SuperAdminClients() {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterKYC, setFilterKYC] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("joined");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients
      .filter(c => {
        const m = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.phone.includes(q);
        const ks = filterKYC === "All" || c.kyc === filterKYC;
        const ss = filterStatus === "All" || c.status === filterStatus;
        return m && ks && ss;
      })
      .sort((a, b) => sortBy === "ltv" ? b.ltv - a.ltv : sortBy === "score" ? b.creditScore - a.creditScore : 0);
  }, [clients, search, filterKYC, filterStatus, sortBy]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === "Active").length,
    verified: clients.filter(c => c.kyc === "Verified").length,
    pending: clients.filter(c => c.kyc === "Pending").length,
    flagged: clients.filter(c => c.flagged).length,
    totalLTV: clients.reduce((s, c) => s + c.ltv, 0),
  }), [clients]);


  const selected = clients.find(c => c.id === selectedId);
  if (selected) {
    return (
      <ClientDetail
        client={selected}
        onBack={() => setSelectedId(null)}
        onUpdate={u => setClients(cs => cs.map(c => c.id === u.id ? u : c))}
        onDelete={id => { setClients(cs => cs.filter(c => c.id !== id)); setSelectedId(null); }}
      />
    );
  }

  
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* Header */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Platform Users</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage global accounts, KYC verifications, and access control.</p>
        </div>
        <button onClick={() => setModal({ type: "add" })} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
          <UserPlus size={18} strokeWidth={2.5} /> Add Client
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fade} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Users", value: stats.total, color: "blue", icon: Users },
          { label: "Active", value: stats.active, color: "emerald", icon: CheckCircle2 },
          { label: "KYC Verified", value: stats.verified, color: "violet", icon: ShieldCheck },
          { label: "KYC Pending", value: stats.pending, color: "amber", icon: Clock },
          { label: "Flagged", value: stats.flagged, color: "rose", icon: ShieldAlert },
          { label: "Global LTV", value: `${(stats.totalLTV / 1000).toFixed(0)}K`, color: "cyan", icon: CreditCard },
        ].map(({ label, value, color, icon: IconCmp }) => {
          const styles = {
            blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
            emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
            violet: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20",
            amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
            rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20",
            cyan: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20",
          }[color];
          
          return (
            <Card key={label} className="p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col items-center justify-center text-center">
              <div className={`w-8 h-8 rounded-lg ${styles} flex items-center justify-center mb-2`}>
                <IconCmp size={16} />
              </div>
              <p className={`text-2xl font-black ${styles.split(' ')[0]} ${styles.split(' ')[1]}`}>{value}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">{label}</p>
            </Card>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#0B1120] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone, ID…"
            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-transparent text-slate-900 dark:text-slate-100 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600" />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap overflow-x-auto pb-1 sm:pb-0">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
          <div className="w-px bg-slate-200 dark:bg-slate-800 mx-1 flex-shrink-0" />
          <select value={filterKYC} onChange={e => setFilterKYC(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
            <option value="All">All KYC</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-sm font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer">
            <option value="joined">Sort: Joined</option>
            <option value="ltv">Sort: LTV ↓</option>
            <option value="score">Sort: Score ↓</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fade}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                  {["Client", "Contact", "KYC", "Credit", "LTV", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
                       <Users size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                       <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No clients found matching your criteria.</p>
                    </td></tr>
                  ) : filtered.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                      className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="sm" flagged={c.flagged} />
                          <div>
                            <button onClick={() => setSelectedId(c.id)} className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors block text-left">{c.name}</button>
                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{c.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5"><Mail size={12} className="text-slate-400" />{c.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1.5 mt-1"><Phone size={12} className="text-slate-400" />{c.phone}</p>
                      </td>
                      <td className="px-5 py-4"><Badge label={c.kyc} style={KYC_STYLES[c.kyc]} /></td>
                      <td className="px-5 py-4 min-w-[120px]"><ScoreBar score={c.creditScore} /></td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">KSh {c.ltv.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{c.bookings} booking{c.bookings !== 1 ? "s" : ""}</p>
                      </td>
                      <td className="px-5 py-4"><Badge label={c.status} style={STATUS_STYLES[c.status]} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedId(c.id)} title="View" className="p-2 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-800 transition-colors shadow-sm"><Eye size={14} /></button>
                          <button onClick={() => setModal({ type: "edit", payload: c })} title="Edit" className="p-2 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-800 transition-colors shadow-sm"><Edit3 size={14} /></button>
                          <button onClick={() => setModal({ type: "confirm_delete", payload: c })} title="Delete" className="p-2 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-800 transition-colors shadow-sm"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Showing <span className="text-slate-700 dark:text-slate-300">{filtered.length}</span> of {clients.length} users</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">Super Admin</p>
          </div>
        </Card>
      </motion.div>

      {/* List Modals */}
      {modal?.type === "add" && <Modal title="Add New Client" onClose={() => setModal(null)} wide><ClientForm onSave={c => { setClients(cs => [...cs, c]); setModal(null); }} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "edit" && <Modal title="Edit Client Profile" onClose={() => setModal(null)} wide><ClientForm initial={modal.payload} onSave={c => { setClients(cs => cs.map(x => x.id === c.id ? c : x)); setModal(null); }} onClose={() => setModal(null)} /></Modal>}
      {modal?.type === "confirm_delete" && <Confirm message={`Permanently delete account for ${modal.payload?.name}? All data will be lost.`} onConfirm={() => { setClients(cs => cs.filter(c => c.id !== modal.payload.id)); setModal(null); }} onCancel={() => setModal(null)} danger />}
    </motion.div>
  );
}