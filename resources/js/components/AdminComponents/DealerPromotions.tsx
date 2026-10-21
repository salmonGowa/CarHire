import { useState, type FormEvent } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import LoadState from "../LoadState";
import {
  Plus, Search, TicketPercent, Tag, TrendingUp, Copy, Edit2, Trash2, X, AlertTriangle, CheckCircle2, Clock, Pause, Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { ksh, longDate } from "@/lib/format";
import type { Promotion, PromotionStatus } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const STATUS: Record<PromotionStatus, { label: string; style: string }> = {
  active: { label: "Active", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  paused: { label: "Paused", style: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  expired: { label: "Expired", style: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" },
  used_up: { label: "Used up", style: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
};

type ModalMode = "create" | "edit" | "delete";
type PromoForm = { code: string; type: Promotion["type"]; value: string; max_uses: string; expires_on: string; is_active: boolean };
const EMPTY: PromoForm = { code: "", type: "percentage", value: "", max_uses: "", expires_on: "", is_active: true };

const selectClass = "w-full h-11 bg-white dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200";

interface PromoList {
  data: Promotion[];
  summary: { active: number; redeemed: number; revenue_this_month: number; discount_this_month: number };
}

export default function DealerPromotions() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ mode: ModalMode; promo: Promotion | null } | null>(null);
  const [formData, setFormData] = useState<PromoForm>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const { data, loading, error, reload } = useApi<PromoList>("/api/promotions");
  const promos = data?.data ?? [];
  const summary = data?.summary;

  // --- CRUD Handlers ---
  const openModal = (mode: ModalMode, promo: Promotion | null = null) => {
    setErrors({});
    setFormData(promo ? {
      code: promo.code, type: promo.type, value: String(promo.value), max_uses: promo.max_uses ? String(promo.max_uses) : "",
      expires_on: promo.expires_on, is_active: promo.is_active,
    } : EMPTY);
    setModal({ mode, promo });
  };

  const closeModal = () => setModal(null);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    const body = { ...formData, value: Number(formData.value), max_uses: formData.max_uses ? Number(formData.max_uses) : null };
    try {
      if (modal.mode === "create") await api("/api/promotions", { method: "POST", body });
      else if (modal.promo) await api(`/api/promotions/${modal.promo.id}`, { method: "PUT", body });
      closeModal();
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!modal?.promo) return;
    setSaving(true);
    try {
      await api(`/api/promotions/${modal.promo.id}`, { method: "DELETE" });
      closeModal();
      reload();
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const togglePaused = async (promo: Promotion) => {
    try {
      await api(`/api/promotions/${promo.id}`, { method: "PUT", body: { ...promo, is_active: !promo.is_active } });
      reload();
    } catch (err) {
      window.alert(errorMessage(err));
    }
  };

  const copy = async (promo: Promotion) => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(promo.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable (e.g. insecure origin) */
    }
  };

  // --- Derived State ---
  const filteredPromos = promos.filter(p => p.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Marketing & Promos</h2>
          <p className="text-sm text-slate-500">Discount codes customers enter when booking your cars. Discounts come off before VAT.</p>
        </div>
        <Button onClick={() => openModal("create")} className="flex items-center gap-2 shadow-blue-500/20">
          <Plus className="w-5 h-5" /> Create Campaign
        </Button>
      </motion.div>

      {/* ── ROI Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><TicketPercent className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Codes</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.active ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Tag className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Redeemed</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.redeemed ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-center relative overflow-hidden">
          <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
          <p className="text-blue-100 text-xs font-black uppercase tracking-widest relative z-10">Promo Bookings (MTD)</p>
          <h3 className="text-2xl font-black relative z-10 mt-1">{summary ? ksh(summary.revenue_this_month) : "—"}</h3>
          {summary && <p className="text-xs text-blue-100 relative z-10 mt-1">{ksh(summary.discount_this_month)} given in discounts</p>}
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
              aria-label="Search promo codes"
              placeholder="Search promo codes..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={filteredPromos.length === 0 && (search ? "No codes match." : "No promotions yet. Create your first campaign.")}>
          <Table heads={["Promo Code", "Discount Value", "Usage", "Expiration", "Status", "Actions"]}>
            {filteredPromos.map((promo) => (
              <Tr key={promo.id}>
                <Td label="Code">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-black tracking-widest text-slate-900 dark:text-white">
                      {promo.code}
                    </div>
                    <button onClick={() => copy(promo)} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="Copy code" aria-label={`Copy ${promo.code}`}>
                      {copied === promo.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </Td>
                <Td label="Value">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    {promo.type === "percentage" ? `${promo.value}% Off` : `${ksh(promo.value)} Off`}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">{promo.type === "percentage" ? "Percentage" : "Flat amount"}</span>
                </Td>
                <Td label="Usage">
                  <div className="flex flex-col gap-1 w-24">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{promo.used} / {promo.max_uses ?? "∞"} used</span>
                    {promo.max_uses && (
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (promo.used / promo.max_uses) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                </Td>
                <Td label="Expires" className="text-sm font-medium text-slate-500">{longDate(promo.expires_on)}</Td>
                <Td label="Status">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS[promo.status].style}`}>
                    {promo.status === "active" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                    {STATUS[promo.status].label}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {(promo.status === "active" || promo.status === "paused") && (
                      <button onClick={() => togglePaused(promo)} title={promo.is_active ? "Pause" : "Resume"} aria-label={promo.is_active ? `Pause ${promo.code}` : `Resume ${promo.code}`}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-amber-600 transition-all">
                        {promo.is_active ? <Pause className="w-4 h-4" /> : <TicketPercent className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => openModal("edit", promo)} aria-label={`Edit ${promo.code}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => openModal("delete", promo)} aria-label={`Delete ${promo.code}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      {/* ── Dynamic CRUD Modal ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              role="dialog" aria-modal="true" aria-label={modal.mode === "create" ? "New campaign" : modal.mode === "edit" ? "Edit campaign" : "Delete promo"}
              className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg ${modal.mode === "delete" ? "bg-rose-500 shadow-rose-500/30" : "bg-blue-500 shadow-blue-500/30"}`}>
                    {modal.mode === "delete" ? <AlertTriangle className="w-6 h-6" /> : <TicketPercent className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {modal.mode === "create" ? "New Campaign" : modal.mode === "edit" ? "Edit Campaign" : "Delete Promo"}
                  </h3>
                </div>
                <button onClick={closeModal} aria-label="Close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {modal.mode === "delete" ? (
                <div className="space-y-6">
                  <p className="text-slate-600 dark:text-slate-300">Delete the code <span className="font-bold text-slate-900 dark:text-white">{formData.code}</span>? Codes that have been used can only be paused.</p>
                  {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
                  <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <Button variant="secondary" fullWidth onClick={closeModal}>Cancel</Button>
                    <Button fullWidth onClick={handleDelete} loading={saving} className="bg-rose-600 hover:bg-rose-700 shadow-rose-500/20">Yes, Delete</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Promo Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. HOLIDAY25" required error={errors.code} />
                    <div>
                      <label htmlFor="promo-status" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Status</label>
                      <select id="promo-status" value={formData.is_active ? "1" : "0"} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "1" })} className={selectClass}>
                        <option value="1">Active</option>
                        <option value="0">Paused</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="promo-type" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Discount Type</label>
                      <select id="promo-type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Promotion["type"] })} className={selectClass}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount (KSh)</option>
                      </select>
                    </div>
                    <Input label="Discount Value" type="number" min={1} max={formData.type === "percentage" ? 100 : undefined} value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder={formData.type === "percentage" ? "20" : "5000"} required error={errors.value} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Max Uses (blank = unlimited)" type="number" min={1} value={formData.max_uses} onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })} placeholder="100" error={errors.max_uses} />
                    <Input label="Expiration Date" type="date" value={formData.expires_on} onChange={(e) => setFormData({ ...formData, expires_on: e.target.value })} required error={errors.expires_on} />
                  </div>
                  {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex gap-4">
                    <Button variant="secondary" fullWidth type="button" onClick={closeModal}>Cancel</Button>
                    <Button fullWidth type="submit" loading={saving}>{modal.mode === "create" ? "Launch Campaign" : "Save Changes"}</Button>
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
