import { useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, CreditCard, Info, Smartphone } from "lucide-react";
import Input from "../Input";
import Button from "../Button";
import { AccountCard, SectionHeading, Toast } from "./AccountUi";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/errors";
import { useToast } from "@/lib/useToast";
import type { Profile } from "@/types/account";

/**
 * How the customer pays. No card details are stored: payments are made to the
 * dealer (M-PESA, card at the counter, cash) and recorded on the invoice.
 */
export default function CustomerPayment({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const [mpesa, setMpesa] = useState(profile.preferences.mpesa_phone ?? "");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const { toast, show } = useToast();

  const save = async () => {
    setSaving(true);
    try {
      onSaved((await api<{ data: Profile }>("/api/profile/preferences", { method: "PUT", body: { mpesa_phone: mpesa.trim() || null } })).data);
      setError(undefined);
      show("M-PESA number saved");
    } catch (err) {
      setError(fieldErrors(err).mpesa_phone);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <SectionHeading title="Payment Details" sub="How you pay for rentals on DriveFleet." />

      <AccountCard title="M-PESA number" icon={<Smartphone className="w-5 h-5 text-emerald-500" />}
        sub="Dealers use this number to send you a payment request or match your payment to your booking.">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
          <div className="flex-1"><Input label="Safaricom number" value={mpesa} onChange={(e) => setMpesa(e.target.value)} placeholder="0712 345 678" error={error} /></div>
          <Button onClick={save} disabled={saving} className="sm:mt-7">{saving ? "Saving…" : "Save"}</Button>
        </div>
      </AccountCard>

      <AccountCard title="Other ways to pay" icon={<Banknote className="w-5 h-5 text-blue-500" />}>
        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex gap-3"><Smartphone className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" /> <span><strong className="text-slate-800 dark:text-slate-200">M-PESA:</strong> pay the dealer's till or paybill and quote your booking reference.</span></li>
          <li className="flex gap-3"><CreditCard className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" /> <span><strong className="text-slate-800 dark:text-slate-200">Card or cash:</strong> at the dealer's counter when you collect the car.</span></li>
        </ul>
        <p className="flex items-start gap-2 text-xs text-slate-500 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
          <Info className="w-4 h-4 shrink-0" /> Paying by card inside the app isn't available yet, so DriveFleet never asks for or stores your card details. Receipts for every payment are under <Link to="/customer-billing" className="text-blue-600 hover:underline">Billing &amp; Payments</Link>.
        </p>
      </AccountCard>
      <Toast message={toast?.message ?? null} error={toast?.error} />
    </div>
  );
}
