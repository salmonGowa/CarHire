import { useState } from "react";
import { Calendar } from "lucide-react";
import Button from "../Button";
import Input from "../Input";
import ICONS from "../SvgIcons";
import { SectionHeader } from "./Constants";



export default function PaymentsSection() {


const PAYMENT_METHODS = [
  { id: 1, type: "visa",       last4: "4242", expiry: "09/27", name: "John Doe",  primary: true  },
  { id: 2, type: "mastercard", last4: "8888", expiry: "03/26", name: "John Doe",  primary: false },
  { id: 3, type: "mpesa",      number: "+254 712 345 678",     name: "John Doe",  primary: false },
];

  const [methods,   setMethods]   = useState(PAYMENT_METHODS);
  const [showAdd,   setShowAdd]   = useState(false);
  const [newCard,   setNewCard]   = useState({ number: "", name: "", expiry: "", cvv: "" });

  const setPrimary = (id: number) => setMethods(m => m.map(c => ({ ...c, primary: c.id === id })));
  const remove     = (id: number) => setMethods(m => m.filter(c => c.id !== id));

  const cardBrand = (type: string) => (({ visa: "Visa", mastercard: "Mastercard", mpesa: "M-PESA" } as Record<string, string>)[type] || <ICONS.CreditCard />);
  const cardGrad  = (type: string) => ({ visa: "from-blue-600 to-blue-800", mastercard: "from-rose-500 to-rose-700", mpesa: "from-emerald-600 to-emerald-800" } as Record<string, string>)[type];

  return (
    <>

      {/* Security notice */}
     

      {/* Card list */}
      <div className="space-y-4 mb-6">
        {methods.map(m => (
          <div key={m.id} className={`relative rounded-2xl border transition-all ${m.primary ? "border-blue-500/50 dark:border-blue-500/40 ring-2 ring-blue-500/15 dark:ring-blue-500/10" : "border-slate-200 dark:border-slate-700"}`}>
            <div className={`h-32 sm:h-36 bg-gradient-to-br ${cardGrad(m.type)} rounded-t-2xl p-5 flex flex-col justify-between overflow-hidden relative`}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />
              <div className="relative flex items-start justify-between">
                <span className="text-white/80 text-xs font-medium">{cardBrand(m.type)}</span>
                {m.primary && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">PRIMARY</span>
                )}
              </div>
              <div className="relative">
                {m.type === "mpesa" ? (
                  <p className="text-white font-mono text-sm tracking-wider">{m.number}</p>
                ) : (
                  <p className="text-white font-mono text-base tracking-[0.2em]">•••• •••• •••• {m.last4}</p>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-white/70 text-xs">{m.name}</p>
                  {m.expiry && <p className="text-white/70 text-xs">{m.expiry}</p>}
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900">
              <button
                onClick={() => !m.primary && setPrimary(m.id)}
                className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${m.primary ? "text-blue-600 dark:text-blue-400 cursor-default" : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"}`}
              >
                {m.primary ? <><ICONS.Check /> Set as primary</> : "Set as primary"}
              </button>
              <button
                onClick={() => !m.primary && remove(m.id)}
                disabled={m.primary}
                className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ICONS.Trash /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full flex items-center justify-center gap-2 h-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
      >
        <ICONS.Plus /> Add payment method
      </button>

      {showAdd && (
        <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 animate-in">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">New Card</h4>
          <Input label="Card Number" value={newCard.number} onChange={e => setNewCard(n => ({...n, number: e.target.value}))} icon={<ICONS.CreditCard />} placeholder="1234 5678 9012 3456" />
          <Input label="Name on Card" value={newCard.name} onChange={e => setNewCard(n => ({...n, name: e.target.value}))} icon={<ICONS.User />} placeholder="John Doe" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expiry" value={newCard.expiry} onChange={e => setNewCard(n => ({...n, expiry: e.target.value}))} icon={<Calendar className="w-4 h-4" />} placeholder="MM/YY" />
            <Input label="CVV" value={newCard.cvv} onChange={e => setNewCard(n => ({...n, cvv: e.target.value}))} icon={<ICONS.Lock />} placeholder="•••" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button size="sm" onClick={() => setShowAdd(false)}>Add Card</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </>
  );
}
