import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import { 
  TicketPercent, Plus, Search, MoreHorizontal, 
  TrendingUp, Clock, CheckCircle2, Tag, Copy, 
  X, Edit2, Trash2, AlertTriangle
} from "lucide-react";

// --- Optimized Mock Data ---
const INITIAL_PROMOS = [
  { id: "PRM-1", code: "WEEKEND20", type: "Percentage", value: "20", used: 45, total: 100, expires: "2023-10-30", status: "Active" },
  { id: "PRM-2", code: "NEWUSER5K", type: "Flat Rate", value: "5000", used: 12, total: 50, expires: "2023-11-15", status: "Active" },
  { id: "PRM-3", code: "FLASH10", type: "Percentage", value: "10", used: 100, total: 100, expires: "2023-10-15", status: "Expired" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DealerPromotions() {
  const [promos, setPromos] = useState(INITIAL_PROMOS);
  const [search, setSearch] = useState("");
  
  // Modal State Management
  const [modal, setModal] = useState({ isOpen: false, mode: 'create', promoId: null });
  const [formData, setFormData] = useState({
    code: "", type: "Percentage", value: "", total: "", expires: "", status: "Active"
  });

  // --- CRUD Handlers ---
  const openModal = (mode, promo = null) => {
    if (promo) {
      setFormData({ ...promo });
    } else {
      setFormData({ code: "", type: "Percentage", value: "", total: "", expires: "", status: "Active" });
    }
    setModal({ isOpen: true, mode, promoId: promo?.id || null });
  };

  const closeModal = () => {
    setModal({ isOpen: false, mode: 'create', promoId: null });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (modal.mode === 'create') {
      const newPromo = { 
        ...formData, 
        id: `PRM-${Date.now()}`, 
        used: 0 
      };
      setPromos([newPromo, ...promos]);
    } else if (modal.mode === 'edit') {
      setPromos(promos.map(p => p.id === modal.promoId ? { ...p, ...formData } : p));
    }
    closeModal();
  };

  const handleDelete = () => {
    setPromos(promos.filter(p => p.id !== modal.promoId));
    closeModal();
  };

  // --- Derived State ---
  const filteredPromos = promos.filter(p => p.code.toLowerCase().includes(search.toLowerCase()));
  const activeCount = promos.filter(p => p.status === 'Active').length;
  const totalRedeemed = promos.reduce((sum, p) => sum + p.used, 0);

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Marketing & Promos</h2>
          <p className="text-sm text-slate-500">Create custom discount codes to drive fleet utilization.</p>
        </div>
        <Button onClick={() => openModal('create')} className="flex items-center gap-2 shadow-blue-500/20">
          <Plus className="w-5 h-5" /> Create Campaign
        </Button>
      </motion.div>

      {/* ── ROI Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><TicketPercent className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Codes</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Tag className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Redeemed</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalRedeemed}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-center relative overflow-hidden">
          <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
          <p className="text-blue-100 text-xs font-black uppercase tracking-widest relative z-10">Promo Revenue (MTD)</p>
          <h3 className="text-2xl font-black relative z-10 mt-1">KSh 320,500</h3>
        </div>
      </motion.div>

      {/* ── Promotions Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search promo codes..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" 
              />
           </div>
        </div>
        
        <Table heads={["Promo Code", "Discount Value", "Usage", "Expiration", "Status", "Actions"]}>
          {filteredPromos.map((promo) => (
            <Tr key={promo.id}>
              <Td label="Code">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-black tracking-widest text-slate-900 dark:text-white">
                    {promo.code}
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="Copy Code"><Copy className="w-4 h-4" /></button>
                </div>
              </Td>
              <Td label="Value">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                  {promo.type === 'Percentage' ? `${promo.value}% Off` : `KSh ${parseInt(promo.value).toLocaleString()} Off`}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">{promo.type}</span>
              </Td>
              <Td label="Usage">
                <div className="flex flex-col gap-1 w-24">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{promo.used} / {promo.total} used</span>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(promo.used / promo.total) * 100}%` }} />
                  </div>
                </div>
              </Td>
              <Td label="Expires" className="text-sm font-medium text-slate-500">{promo.expires}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  promo.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {promo.status === 'Active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                  {promo.status}
                </span>
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => openModal('edit', promo)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => openModal('delete', promo)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </Td>
            </Tr>
          ))}
          {filteredPromos.length === 0 && (
            <Tr><Td colSpan="6" className="text-center py-8 text-slate-500">No promotions found.</Td></Tr>
          )}
        </Table>
      </motion.div>

      {/* ── Dynamic CRUD Modal ── */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg ${modal.mode === 'delete' ? 'bg-rose-500 shadow-rose-500/30' : 'bg-blue-500 shadow-blue-500/30'}`}>
                    {modal.mode === 'delete' ? <AlertTriangle className="w-6 h-6" /> : <TicketPercent className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {modal.mode === 'create' ? "New Campaign" : modal.mode === 'edit' ? "Edit Campaign" : "Delete Promo"}
                  </h3>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {modal.mode === 'delete' ? (
                <div className="space-y-6">
                  <p className="text-slate-600 dark:text-slate-300">Are you sure you want to delete the promotion code <span className="font-bold text-slate-900 dark:text-white">{formData.code}</span>? This action cannot be undone.</p>
                  <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
                    <Button fullWidth onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 shadow-rose-500/20">Yes, Delete</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Promo Code" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      placeholder="e.g. HOLIDAY25" required 
                    />
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                        <select 
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200"
                        >
                          <option value="Active">Active</option>
                          <option value="Expired">Expired</option>
                        </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Discount Type</label>
                        <select 
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200"
                        >
                          <option value="Percentage">Percentage (%)</option>
                          <option value="Flat Rate">Flat Amount (KSh)</option>
                        </select>
                     </div>
                     <Input 
                        label="Discount Value" 
                        type="number" 
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: e.target.value})}
                        placeholder={formData.type === 'Percentage' ? "20" : "5000"} required 
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <Input 
                        label="Max Uses (Inventory)" 
                        type="number" 
                        value={formData.total}
                        onChange={(e) => setFormData({...formData, total: parseInt(e.target.value) || ""})}
                        placeholder="100" required
                     />
                     <Input 
                        label="Expiration Date" 
                        type="date" 
                        value={formData.expires}
                        onChange={(e) => setFormData({...formData, expires: e.target.value})}
                        required 
                     />
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex gap-4">
                     <Button variant="secondary" fullWidth type="button" onClick={closeModal}>Cancel</Button>
                     <Button fullWidth type="submit">{modal.mode === 'create' ? 'Launch Campaign' : 'Save Changes'}</Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}