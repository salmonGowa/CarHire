import { useCallback, useState, type FormEvent } from "react";
import { CheckCircle2, CreditCard, Loader2, Smartphone, XCircle } from "lucide-react";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/errors";
import { ksh } from "@/lib/format";
import { useNow, formatDuration } from "@/lib/useNow";
import { useOnlinePayment } from "@/lib/useOnlinePayment";
import type { OnlinePayment } from "@/types/models";

export interface PayTarget {
  bookingId: number;
  reference: string;
  balance: number;
  /** Number to prefill for the M-PESA prompt. */
  phone?: string | null;
  /** Card checkout is the customer's own; staff only send M-PESA prompts. */
  allowCard: boolean;
  /** Staff sending a prompt to the customer, rather than the customer paying. */
  forCustomer?: string;
}

/**
 * Pay a booking online: an M-PESA prompt to a phone (then wait for the PIN),
 * or a card checkout on the provider's page.
 */
export default function PayNowModal({ target, onClose, onPaid }: { target: PayTarget | null; onClose: () => void; onPaid: (p: OnlinePayment) => void }) {
  return (
    <Modal open={!!target} onClose={onClose} width="max-w-md"
      title={target?.forCustomer ? "Send M-PESA prompt" : "Pay now"}
      subtitle={target && <>{target.reference} · {ksh(target.balance)} due{target.forCustomer ? ` · ${target.forCustomer}` : ""}</>}>
      {target && <PayForm key={target.bookingId} target={target} onClose={onClose} onPaid={onPaid} />}
    </Modal>
  );
}

function PayForm({ target, onClose, onPaid }: { target: PayTarget; onClose: () => void; onPaid: (p: OnlinePayment) => void }) {
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [amount, setAmount] = useState(String(target.balance));
  const [phone, setPhone] = useState(target.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState<OnlinePayment | null>(null);

  const settled = useCallback((p: OnlinePayment) => { if (p.status === "succeeded") onPaid(p); }, [onPaid]);
  const payment = useOnlinePayment(started, settled);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (method === "card") {
        const { authorization_url } = await api<{ authorization_url: string }>(`/api/bookings/${target.bookingId}/pay/card`, { method: "POST", body: { amount: Number(amount) } });
        window.location.assign(authorization_url);
        return; // leaving the page
      }
      const { data } = await api<{ data: OnlinePayment }>(`/api/bookings/${target.bookingId}/pay/mpesa`, { method: "POST", body: { phone, amount: Number(amount) } });
      setStarted(data);
    } catch (err) {
      setErrors(fieldErrors(err));
    }
    setBusy(false);
  };

  if (payment) return <PromptStatus payment={payment} forCustomer={target.forCustomer} onClose={onClose} onRetry={() => setStarted(null)} />;

  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      {target.allowCard && (
        <div role="group" aria-label="Pay with" className="grid grid-cols-2 gap-2">
          {([["mpesa", "M-PESA", Smartphone], ["card", "Card", CreditCard]] as const).map(([id, label, Icon]) => (
            <button key={id} type="button" aria-pressed={method === id} onClick={() => setMethod(id)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-all ${method === id
                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 text-blue-600 dark:text-blue-400"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      )}
      <Input label="Amount (KSh)" type="number" min={1} max={target.balance} value={amount} onChange={(e) => setAmount(e.target.value)} required error={errors.amount} />
      {method === "mpesa" ? (
        <Input label="M-PESA number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" autoComplete="tel" required error={errors.phone} />
      ) : (
        <p className="text-xs text-slate-500">You'll enter your card on the payment provider's secure page and come straight back here. DriveFleet never sees your card details.</p>
      )}
      {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
      <Button type="submit" fullWidth loading={busy}>
        {method === "mpesa" ? (target.forCustomer ? "Send prompt" : "Send M-PESA prompt") : "Continue to card payment"} · {amount ? ksh(Number(amount)) : ""}
      </Button>
      <p className="text-[11px] text-center text-slate-400">
        {method === "mpesa" ? `${target.forCustomer ? "The customer" : "You"} will get a prompt on the phone to enter the M-PESA PIN.` : "Paid by card goes to DriveFleet, which pays the dealer."}
      </p>
    </form>
  );
}

function PromptStatus({ payment, forCustomer, onClose, onRetry }: { payment: OnlinePayment; forCustomer?: string; onClose: () => void; onRetry: () => void }) {
  const now = useNow();
  const left = new Date(payment.expires_at).getTime() - now;

  if (payment.status === "succeeded") {
    return (
      <div className="p-8 text-center space-y-3" role="status">
        <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500" />
        <p className="text-lg font-black text-slate-900 dark:text-white">{ksh(payment.amount)} received</p>
        {payment.receipt && <p className="text-sm text-slate-500">M-PESA receipt <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{payment.receipt}</span></p>}
        <Button onClick={onClose} fullWidth>Done</Button>
      </div>
    );
  }
  if (payment.status !== "pending") {
    return (
      <div className="p-8 text-center space-y-3" role="alert">
        <XCircle className="w-14 h-14 mx-auto text-rose-500" />
        <p className="text-lg font-black text-slate-900 dark:text-white">Payment didn't go through</p>
        <p className="text-sm text-slate-500">{payment.message ?? "No money was taken."}</p>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Close</Button>
          <Button onClick={onRetry} className="flex-1">Try again</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-8 text-center space-y-3" role="status" aria-live="polite">
      <div className="relative w-16 h-16 mx-auto">
        <Smartphone className="w-16 h-16 text-emerald-500" />
        <Loader2 className="w-6 h-6 absolute -right-1 -bottom-1 text-blue-500 animate-spin" />
      </div>
      <p className="text-lg font-black text-slate-900 dark:text-white">{forCustomer ? "Prompt sent" : "Check your phone"}</p>
      <p className="text-sm text-slate-500">
        {forCustomer ? `${forCustomer} should enter their M-PESA PIN on ${payment.phone}` : `Enter your M-PESA PIN on ${payment.phone}`} to pay {ksh(payment.amount)}.
      </p>
      <p className="text-xs text-slate-400">{left > 0 ? `Waiting… the prompt expires in ${formatDuration(left)}` : "Still checking with M-PESA…"}</p>
      {payment.simulated && <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Simulated M-PESA: no prompt is really sent and no money moves.</p>}
      <Button variant="ghost" onClick={onClose} fullWidth>Close: it'll update on its own</Button>
    </div>
  );
}
