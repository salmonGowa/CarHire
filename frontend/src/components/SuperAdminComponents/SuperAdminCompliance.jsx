import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import { 
  FileCheck, ShieldAlert, Building2, AlertTriangle, 
  Search, CheckCircle2, Clock, FileText, 
  Trash2, XCircle, Plus, Eye, Filter
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_RECORDS = [
  { id: "CMP-091", dealer: "Swift Car Hire", type: "KRA PIN Certificate", expiry: "Never", status: "Verified", updated: "Oct 10, 2023", notes: "Verified against KRA iTax portal." },
  { id: "CMP-092", dealer: "Luxe Drive", type: "County Business License", expiry: "Dec 31, 2023", status: "Expiring Soon", updated: "Jan 15, 2023", notes: "Sent reminder on Nov 1st." },
  { id: "CMP-093", dealer: "City Movers", type: "NTSA Fleet Registry", expiry: "Oct 20, 2023", status: "Overdue", updated: "Oct 21, 2023", notes: "Operations paused pending NTSA renewal." },
  { id: "CMP-094", dealer: "Premier Auto", type: "Director KYC Documents", expiry: "Never", status: "Pending Review", updated: "Oct 25, 2023", notes: "Awaiting ID and Passport photo verification." },
  { id: "CMP-095", dealer: "Budget Wheels", type: "Comprehensive Insurance", expiry: "Nov 30, 2023", status: "Verified", updated: "Nov 01, 2022", notes: "Policy covers all 45 vehicles." },
];

const STATUS_STYLES = {
  "Verified": "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
  "Expiring Soon": "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400",
  "Overdue": "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400",
  "Pending Review": "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
};

// ─── Animations ─────────────────────────────────────────────────────────────
const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

// ─── Modal Shells ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide = false }) => (
  <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} bg-white dark:bg-[#0B1120] rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/60 sticky top-0 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md z-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><XCircle className="w-6 h-6" /></button>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const Confirm = ({ message, onConfirm, onCancel }) => (
  <Modal title="Confirm Action" onClose={onCancel}>
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
    </div>
    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60">
      <Button variant="secondary" onClick={onCancel} className="px-6">Cancel</Button>
      <Button variant="danger" onClick={onConfirm} className="px-6 shadow-rose-500/20">Yes, Confirm</Button>
    </div>
  </Modal>
);

// ─── Forms ────────────────────────────────────────────────────────────────────
const RequestDocForm = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ id: `CMP-${Math.floor(100 + Math.random() * 900)}`, dealer: "", type: "KRA PIN Certificate", expiry: "", status: "Pending Review", updated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), notes: "" });
  
  return (
    <div className="space-y-5">
      <Input label="Dealership Name" placeholder="e.g. Swift Car Hire" value={form.dealer} onChange={e => setForm(f => ({ ...f, dealer: e.target.value }))} required />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Document Type</label>
           <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all appearance-none">
             <option>KRA PIN Certificate</option>
             <option>NTSA Fleet Registry</option>
             <option>County Business License</option>
             <option>Comprehensive Insurance</option>
             <option>Director KYC</option>
           </select>
        </div>
        <Input label="Requested Due Date" type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
      </div>
      
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Request Notes</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Add instructions for the dealer..."
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600" />
      </div>
      
      <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-6">
        <Button variant="secondary" onClick={onClose} className="px-6">Cancel</Button>
        <Button onClick={() => { if(form.dealer && form.type) onSave(form) }} className="px-6 shadow-blue-500/20">Send Request</Button>
      </div>
    </div>
  );
};

const ReviewDocModal = ({ record, onStatusChange, onClose }) => {
  const [notes, setNotes] = useState(record.notes || "");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0"><FileCheck className="w-6 h-6" /></div>
        <div>
          <p className="font-black text-slate-900 dark:text-white">{record.type}</p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{record.dealer} · ID: {record.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
        <div>
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Current Status</span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLES[record.status]}`}>{record.status}</span>
        </div>
        <div>
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Expiry Date</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{record.expiry}</span>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Compliance Officer Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Add review notes or rejection reasons..."
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <Button variant="danger" fullWidth onClick={() => onStatusChange(record.id, "Overdue", notes)} className="shadow-rose-500/20">Reject / Mark Overdue</Button>
        <Button fullWidth onClick={() => onStatusChange(record.id, "Verified", notes)} className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20 border-none text-white">Approve Document</Button>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function SuperAdminCompliance() {
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [modal, setModal] = useState(null); 
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Filtering Logic
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter(r => {
      const matchSearch = !q || r.dealer.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchStatus = filterStatus === "All" || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [records, search, filterStatus]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = records.length;
    const pending = records.filter(r => r.status === "Pending Review").length;
    const actionNeeded = records.filter(r => r.status === "Overdue" || r.status === "Expiring Soon").length;
    const verified = records.filter(r => r.status === "Verified").length;
    const complianceRate = total > 0 ? Math.round((verified / total) * 100) : 0;
    return { pending, actionNeeded, complianceRate };
  }, [records]);

  // CRUD Actions
  const handleRequestDoc = (newDoc) => {
    setRecords([newDoc, ...records]);
    setModal(null);
  };

  const handleStatusChange = (id, newStatus, notes) => {
    setRecords(records.map(r => r.id === id ? { ...r, status: newStatus, notes, updated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : r));
    setModal(null);
  };

  const handleDelete = (id) => {
    setRecords(records.filter(r => r.id !== id));
    setModal(null);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={fade} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Compliance & Legal</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor dealership licensing, tax compliance, and KYC documents.</p>
        </div>
        <Button onClick={() => setModal({ type: 'request' })} className="flex items-center gap-2 shadow-blue-500/20">
          <Plus className="w-5 h-5" /> Request Document
        </Button>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div variants={fade} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600"><Clock className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Reviews</p><h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.pending}</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 flex items-center gap-4 shadow-sm">
          <div className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600"><ShieldAlert className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-rose-600 uppercase tracking-widest">Expired / Overdue</p><h3 className="text-2xl font-black text-rose-600 mt-0.5">{stats.actionNeeded}</h3></div>
        </div>
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fully Compliant</p><h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.complianceRate}%</h3></div>
        </div>
      </motion.div>

      {/* ── Table & Filters ── */}
      <motion.div variants={fade} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search documents or dealers..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white transition-all" 
              />
           </div>
           <div className="flex gap-2">
             <select 
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-bold focus:outline-none focus:ring-2 ring-blue-500/20 transition-all appearance-none cursor-pointer"
             >
                <option value="All">All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Overdue">Overdue</option>
             </select>
             <button className="p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-slate-400 hover:text-blue-500 transition-colors"><Filter className="w-4 h-4" /></button>
           </div>
        </div>

        {/* Custom Responsive Table Component */}
        <Table heads={["Dealership", "Document Type", "Expiry Date", "Status", "Last Updated", "Actions"]}>
          {filtered.map((rec) => (
            <Tr key={rec.id}>
              <Td label="Dealership">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{rec.dealer}</span>
                </div>
              </Td>
              
              <Td label="Document Type">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm block">{rec.type}</span>
                <span className="font-mono text-[10px] font-black text-slate-400 tracking-widest mt-0.5 block">{rec.id}</span>
              </Td>
              
              <Td label="Expiry Date" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {rec.expiry}
              </Td>
              
              <Td label="Status">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLES[rec.status]}`}>
                  {(rec.status === 'Overdue' || rec.status === 'Expiring Soon') && <AlertTriangle className="w-3 h-3" />}
                  {rec.status === 'Verified' && <CheckCircle2 className="w-3 h-3" />}
                  {rec.status === 'Pending Review' && <Clock className="w-3 h-3" />}
                  {rec.status}
                </span>
              </Td>
              
              <Td label="Last Updated" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {rec.updated}
              </Td>
              
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => setModal({ type: 'review', payload: rec })} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors" title="Review Document"><Eye className="w-5 h-5" /></button>
                  <button onClick={() => setModal({ type: 'delete', payload: rec })} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors" title="Delete Record"><Trash2 className="w-5 h-5" /></button>
                </div>
              </Td>
            </Tr>
          ))}
          {filtered.length === 0 && (
            <Tr>
               <Td colSpan="6" className="text-center py-12 text-slate-500">
                  <FileCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="font-medium text-slate-500 dark:text-slate-400">No compliance records found.</p>
               </Td>
            </Tr>
          )}
        </Table>
      </motion.div>

      {/* ── Modals ── */}
      {modal?.type === "request" && (
        <Modal title="Request Compliance Document" onClose={() => setModal(null)} wide>
          <RequestDocForm onSave={handleRequestDoc} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === "review" && (
        <Modal title="Review Compliance Record" onClose={() => setModal(null)}>
          <ReviewDocModal record={modal.payload} onStatusChange={handleStatusChange} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <Confirm 
          message={`Permanently revoke and delete tracking for ${modal.payload?.dealer}'s ${modal.payload?.type}? This will remove it from the compliance board.`} 
          onConfirm={() => handleDelete(modal.payload.id)} 
          onCancel={() => setModal(null)} 
        />
      )}

    </motion.div>
  );
}