import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Button from "./Button";
import Input from "./Input";
import { api, ApiError } from "@/lib/api";
import { PAYMENT_LABEL, ksh } from "@/lib/format";
import type { Payment, ReceivedMethod } from "@/types/models";

export interface PaymentTarget {
  bookingId: number;
  label: string;
  balance: number;
}

const METHODS: ReceivedMethod[] = ["mpesa", "cash", "card", "bank"];

/**
 * Staff record money they have received for a booking. The server checks the
 * amount against the invoice balance and rejects reused transaction codes.
 */
export default function RecordPaymentModal({ target, onClose, onRecorded }: {
  target: PaymentTarget | null;
  onClose: () => void;
  onRecorded: (payment: Payment) => void;
}) {
  const [amount, setAmount] = useState(target ? String(target.balance) : "");
  const [method, setMethod] = useState<ReceivedMethod>("mpesa");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api<{ data: Payment }>(`/api/bookings/${target.bookingId}/payments`, {
        method: "POST",
        body: { amount: Number(amount), method, transaction_code: code || null },
      });
      onRecorded(data);
      onClose();
    } catch (err) {
      setErrors(err instanceof ApiError
        ? { ...Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])), ...(Object.keys(err.errors).length ? {} : { form: err.message }) }
        : { form: "Couldn't reach the server. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const needsCode = method === "mpesa" || method === "bank";

  return (
    <AnimatePresence>
      {target && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog" aria-modal="true" aria-label="Record payment"
            className="relative w-full max-w-md bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/60">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Record payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">{target.label} · balance {ksh(target.balance)}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5">Received by</p>
                <div className="grid grid-cols-4 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={method === m}
                      onClick={() => setMethod(m)}
                      className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                        method === m
                          ? "bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 text-blue-600 dark:text-blue-400"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {m === "bank" ? "Bank" : PAYMENT_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Amount (KSh)" type="number" min={1} max={target.balance} value={amount} onChange={(e) => setAmount(e.target.value)} required error={errors.amount} />
              {needsCode && (
                <Input
                  label={method === "mpesa" ? "M-PESA transaction code" : "Bank reference"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={method === "mpesa" ? "e.g. SGH7K2L9QX" : "Transfer reference"}
                  required
                  error={errors.transaction_code}
                />
              )}
              {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
              <Button type="submit" fullWidth loading={saving}>Record {amount ? ksh(Number(amount)) : "payment"}</Button>
              <p className="text-[11px] text-center text-slate-400">Records money already received. It does not charge the customer.</p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
