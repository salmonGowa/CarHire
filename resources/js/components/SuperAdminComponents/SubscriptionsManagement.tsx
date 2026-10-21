import { useState, type ReactNode } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { CreditCard, TrendingUp, AlertTriangle, Receipt, Edit3, X, CheckCircle2, Building2 } from "lucide-react";
import { Table, Td, Tr } from "../Card";
import LoadState from "../LoadState";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { PAYMENT_LABEL, ksh, longDate } from "@/lib/format";
import type { ReceivedMethod } from "@/types/models";
import type { SubscriptionCharge, SubscriptionPlan } from "@/types/platform";

interface DealerRow {
  id: number;
  name: string;
  status: string;
  plan: { id: number; name: string; monthly_fee: number } | null;
  vehicles: number;
  vehicle_limit: number | null;
  staff: number;
  staff_limit: number | null;
  outstanding: number;
  latest_charge: SubscriptionCharge | null;
}
interface SubscriptionData {
  plans: SubscriptionPlan[];
  dealers: DealerRow[];
  charges: SubscriptionCharge[];
  summary: { mrr: number; active_subscriptions: number; without_plan: number; overdue_count: number; overdue_amount: number; collected_this_month: number; current_period: string; unbilled_this_month: number };
}

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const CHARGE_STYLE: Record<SubscriptionCharge["status"], string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  void: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};
const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";
const card = "rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm";
const monthLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-KE", { month: "long", year: "numeric" });
const usage = (n: number, limit: number | null) => `${n} / ${limit ?? "∞"}`;

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} role="dialog" aria-modal="true" aria-label={title}
        className="w-full max-w-md bg-white dark:bg-[#0B1120] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-black text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function PlanForm({ plan, onClose, onSaved }: { plan: SubscriptionPlan; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    monthly_fee: String(plan.monthly_fee), vehicle_limit: plan.vehicle_limit?.toString() ?? "", staff_limit: plan.staff_limit?.toString() ?? "", description: plan.description ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const num = (v: string) => (v === "" ? null : Number(v));
  const save = async () => {
    try {
      await api(`/api/admin/subscription-plans/${plan.id}`, { method: "PUT", body: { monthly_fee: Number(form.monthly_fee), vehicle_limit: num(form.vehicle_limit), staff_limit: num(form.staff_limit), description: form.description || null } });
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
    }
  };
  const field = (k: keyof typeof form, label: string, hint?: string) => (
    <label className="block">
      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</span>
      <input type="number" min={0} value={form[k]} onChange={set(k)} placeholder={hint} className={inputClass} />
      {errors[k] && <span className="block text-xs text-rose-500 mt-1">{errors[k]}</span>}
    </label>
  );
  return (
    <Dialog title={`Edit ${plan.name} plan`} onClose={onClose}>
      {field("monthly_fee", "Monthly fee (KSh)")}
      <div className="grid grid-cols-2 gap-4">{field("vehicle_limit", "Vehicle limit", "Unlimited")}{field("staff_limit", "Staff logins", "Unlimited")}</div>
      <label className="block">
        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</span>
        <textarea value={form.description} onChange={set("description")} rows={2} className={`${inputClass} resize-none`} />
      </label>
      <p className="text-xs text-slate-500">A new price applies from the next charge. Charges already raised keep their amount.</p>
      {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold">Save Plan</button>
      </div>
    </Dialog>
  );
}

function PayForm({ charge, onClose, onSaved }: { charge: SubscriptionCharge; onClose: () => void; onSaved: () => void }) {
  const [method, setMethod] = useState<ReceivedMethod>("mpesa");
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");
  const save = async () => {
    try {
      await api(`/api/admin/subscription-charges/${charge.id}/pay`, { method: "POST", body: { method, transaction_ref: ref || null } });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Dialog title="Record subscription payment" onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">{charge.dealer.name}</span> · {charge.plan} plan, {monthLabel(charge.period)} · <span className="font-black">{ksh(charge.amount)}</span></p>
      <label className="block">
        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Received by</span>
        <select value={method} onChange={(e) => setMethod(e.target.value as ReceivedMethod)} className={inputClass}>
          {(["mpesa", "bank", "card", "cash"] as const).map((m) => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Transaction reference</span>
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. M-PESA code" className={inputClass} />
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
        <button onClick={save} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">Mark Paid</button>
      </div>
    </Dialog>
  );
}

export default function SubscriptionsManagement() {
  const [chargeFilter, setChargeFilter] = useState("");
  const { data, loading, error, reload } = useApi<SubscriptionData>(`/api/admin/subscriptions${chargeFilter ? `?status=${chargeFilter}` : ""}`);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [paying, setPaying] = useState<SubscriptionCharge | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const s = data?.summary;

  const run = async (fn: () => Promise<string | null>) => {
    try {
      const ok = await fn();
      setMessage(ok ? { ok: true, text: ok } : null);
      reload();
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) });
    }
  };
  const issue = () => run(async () => {
    const res = await api<{ created: number }>("/api/admin/subscription-charges/issue", { method: "POST" });
    return res.created ? `Raised ${res.created} charge${res.created === 1 ? "" : "s"} for ${monthLabel(s!.current_period)}.` : "Every dealer has already been billed this month.";
  });
  const assign = (dealer: DealerRow, planId: string) =>
    run(async () => {
      await api(`/api/admin/dealers/${dealer.id}/plan`, { method: "PUT", body: { subscription_plan_id: planId ? Number(planId) : null } });
      return `${dealer.name}'s plan updated. The new price applies from the next charge.`;
    });
  const voidCharge = (c: SubscriptionCharge) => {
    if (window.confirm(`Void ${c.reference} (${ksh(c.amount)}) for ${c.dealer.name}? They won't owe it any more.`)) run(async () => {
      await api(`/api/admin/subscription-charges/${c.id}/void`, { method: "POST" });
      return `Voided ${c.reference}.`;
    });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Dealer Subscriptions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monthly plan fees, billed on the 1st. Dealers pay by M-PESA or bank transfer and you record it here.</p>
        </div>
        {s && (
          <button onClick={issue} disabled={s.unbilled_this_month === 0}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
            <Receipt className="w-4 h-4" /> {s.unbilled_this_month ? `Bill ${s.unbilled_this_month} dealer${s.unbilled_this_month === 1 ? "" : "s"} for ${monthLabel(s.current_period)}` : `${monthLabel(s.current_period)} billed`}
          </button>
        )}
      </motion.div>

      {message && <p role="status" className={`text-sm ${message.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{message.text}</p>}

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-sm font-semibold text-blue-100">Monthly Recurring Revenue</p><h3 className="text-2xl font-black">{s ? ksh(s.mrr) : "—"}</h3>{s && <p className="text-xs text-blue-100">{ksh(s.collected_this_month)} collected this month</p>}</div>
        </div>
        <div className={`p-6 ${card} flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CreditCard className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Subscriptions</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s?.active_subscriptions ?? "—"}</h3>{s && s.without_plan > 0 && <p className="text-xs text-amber-600">{s.without_plan} active dealer{s.without_plan === 1 ? "" : "s"} with no plan</p>}</div>
        </div>
        <button onClick={() => setChargeFilter("overdue")} className={`text-left p-6 ${card} flex items-center gap-4 hover:border-rose-300`}>
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue Payments</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s?.overdue_count ?? "—"}</h3>{s && s.overdue_amount > 0 && <p className="text-xs text-rose-600">{ksh(s.overdue_amount)} outstanding</p>}</div>
        </button>
      </motion.div>

      <LoadState loading={loading && !data} error={error} onRetry={reload}>
        {data && (
          <>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.plans.map((p) => (
                <div key={p.id} className={`p-5 ${card}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{p.name}</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{ksh(p.monthly_fee)}<span className="text-xs font-medium text-slate-400"> / month</span></p>
                    </div>
                    <button onClick={() => setEditing(p)} aria-label={`Edit ${p.name} plan`} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit3 className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{p.description}</p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-3">{p.vehicle_limit ?? "Unlimited"} vehicles · {p.staff_limit ?? "unlimited"} staff · {p.dealers} dealer{p.dealers === 1 ? "" : "s"}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className={`${card} overflow-hidden`}>
              <div className="p-5 border-b border-slate-100 dark:border-slate-800"><h3 className="font-black text-slate-900 dark:text-white">Dealers</h3></div>
              <Table heads={["Dealer", "Plan", "Vehicles", "Staff", "Latest Charge", "Outstanding"]}>
                {data.dealers.map((d) => (
                  <Tr key={d.id}>
                    <Td label="Dealer">
                      <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> {d.name}</span>
                      {d.status !== "active" && <span className="text-[10px] font-black uppercase text-rose-500">{d.status} · not billed</span>}
                    </Td>
                    <Td label="Plan">
                      <select aria-label={`Plan for ${d.name}`} value={d.plan?.id ?? ""} onChange={(e) => assign(d, e.target.value)}
                        className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <option value="">No plan</option>
                        {data.plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {ksh(p.monthly_fee)}</option>)}
                      </select>
                    </Td>
                    <Td label="Vehicles" className={`text-sm font-bold ${d.vehicle_limit !== null && d.vehicles >= d.vehicle_limit ? "text-amber-600" : "text-slate-600 dark:text-slate-300"}`}>{usage(d.vehicles, d.vehicle_limit)}</Td>
                    <Td label="Staff" className="text-sm font-bold text-slate-600 dark:text-slate-300">{usage(d.staff, d.staff_limit)}</Td>
                    <Td label="Latest Charge">
                      {d.latest_charge ? (
                        <span className="text-xs text-slate-500">{monthLabel(d.latest_charge.period)} <span className={`ml-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${CHARGE_STYLE[d.latest_charge.status]}`}>{d.latest_charge.status}</span></span>
                      ) : <span className="text-xs text-slate-400">Never billed</span>}
                    </Td>
                    <Td label="Outstanding" className={`font-black ${d.outstanding ? "text-rose-600" : "text-slate-400"}`}>{d.outstanding ? ksh(d.outstanding) : "—"}</Td>
                  </Tr>
                ))}
              </Table>
            </motion.div>

            <motion.div variants={itemVariants} className={`${card} overflow-hidden`}>
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-black text-slate-900 dark:text-white">Charges</h3>
                <div className="flex gap-1" role="group" aria-label="Charge status">
                  {[["", "All"], ["overdue", "Overdue"], ["pending", "Due"], ["paid", "Paid"], ["void", "Void"]].map(([v, l]) => (
                    <button key={v} onClick={() => setChargeFilter(v)} aria-pressed={chargeFilter === v}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${chargeFilter === v ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{l}</button>
                  ))}
                </div>
              </div>
              {data.charges.length === 0 ? <p className="p-10 text-center text-sm text-slate-400">No charges.</p> : (
                <Table heads={["Reference", "Dealer", "Period", "Amount", "Due", "Status", "Actions"]}>
                  {data.charges.map((c) => (
                    <Tr key={c.id}>
                      <Td label="Reference"><span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">{c.reference}</span></Td>
                      <Td label="Dealer" className="font-bold text-slate-900 dark:text-slate-200">{c.dealer.name}<span className="block text-[10px] font-medium text-slate-400">{c.plan} plan</span></Td>
                      <Td label="Period" className="text-sm text-slate-600 dark:text-slate-300">{monthLabel(c.period)}</Td>
                      <Td label="Amount" className="font-black text-slate-900 dark:text-white">{ksh(c.amount)}</Td>
                      <Td label="Due" className="text-xs text-slate-500">{c.status === "paid" && c.paid_at ? <>Paid {longDate(c.paid_at)}<span className="block">{PAYMENT_LABEL[c.method as ReceivedMethod] ?? c.method}{c.transaction_ref && ` · ${c.transaction_ref}`}</span></> : longDate(c.due_on)}</Td>
                      <Td label="Status"><span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${CHARGE_STYLE[c.status]}`}>{c.status}</span></Td>
                      <Td className="text-right">
                        {(c.status === "pending" || c.status === "overdue") && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setPaying(c)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Record payment</button>
                            <button onClick={() => voidCharge(c)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">Void</button>
                          </div>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Table>
              )}
            </motion.div>
          </>
        )}
      </LoadState>

      <AnimatePresence>
        {editing && <PlanForm plan={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
        {paying && <PayForm charge={paying} onClose={() => setPaying(null)} onSaved={() => { setPaying(null); setMessage({ ok: true, text: `Recorded ${paying.reference} as paid.` }); reload(); }} />}
      </AnimatePresence>
    </motion.div>
  );
}
