import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../Button";
import Input from "../Input";
import { api, ApiError } from "@/lib/api";
import { ksh, quote } from "@/lib/format";
import type { Booking, Vehicle } from "@/types/models";

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const tomorrowAt10 = (plusDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + 1 + plusDays);
  d.setHours(10, 0, 0, 0);
  return toLocalInput(d);
};

/** Customer booking request for one vehicle. The server re-checks availability and price. */
export default function BookVehicleModal({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const navigate = useNavigate();
  const [pickupAt, setPickupAt] = useState(tomorrowAt10());
  const [returnAt, setReturnAt] = useState(tomorrowAt10(2));
  const [location, setLocation] = useState("");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; description: string; days: number; discount: number; subtotal: number; vat: number; total: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [booked, setBooked] = useState<Booking | null>(null);

  const basePreview = vehicle ? quote(vehicle.daily_rate, pickupAt, returnAt) : null;
  // An applied code's server quote is only valid for the dates it was checked against.
  const preview = applied && basePreview && applied.days === basePreview.days ? applied : basePreview;
  const discount = applied && preview === applied ? applied.discount : 0;

  const applyCode = async () => {
    if (!vehicle || !code.trim()) return;
    setChecking(true);
    setErrors((e) => ({ ...e, promo_code: "" }));
    try {
      const q = new URLSearchParams({ code: code.trim(), vehicle_id: String(vehicle.id), pickup_at: pickupAt, return_at: returnAt });
      setApplied(await api(`/api/promotions/check?${q}`));
    } catch (err) {
      setApplied(null);
      setErrors((e) => ({ ...e, promo_code: err instanceof ApiError ? (err.errors.promo_code?.[0] ?? err.errors.return_at?.[0] ?? err.message) : "Couldn't check that code." }));
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api<{ data: Booking }>("/api/bookings", {
        method: "POST",
        body: { vehicle_id: vehicle.id, pickup_at: pickupAt, return_at: returnAt, pickup_location: location || vehicle.location || "Branch", promo_code: applied?.code ?? null },
      });
      setBooked(data);
    } catch (err) {
      setErrors(err instanceof ApiError
        ? { ...Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])), ...(Object.keys(err.errors).length ? {} : { form: err.message }) }
        : { form: "Couldn't reach the server. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    setBooked(null);
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {vehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog" aria-modal="true" aria-label={`Book ${vehicle.model}`}
            className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800/60">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{booked ? "Booking requested" : `Book ${vehicle.model}`}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{vehicle.dealer?.name} · {ksh(vehicle.daily_rate)}/day</p>
              </div>
              <button onClick={close} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" aria-label="Close">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {booked ? (
              <div className="p-6 space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CalendarCheck2 className="w-8 h-8" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{booked.reference}</span> is waiting for {booked.dealer?.name} to confirm.
                  Total {ksh(booked.total)} for {booked.days} day{booked.days === 1 ? "" : "s"}.
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={close}>Keep browsing</Button>
                  <Button fullWidth onClick={() => navigate("/customer-rentals")}>View my rentals</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Pickup" type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} required error={errors.pickup_at} />
                  <Input label="Return" type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} required error={errors.return_at} />
                </div>
                <Input label="Pickup location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={vehicle.location ? `${vehicle.location} branch` : "Branch"} error={errors.pickup_location} />

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input label="Promo code (optional)" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setApplied(null); }} placeholder="e.g. WEEKEND20" error={errors.promo_code || undefined} />
                  </div>
                  <Button type="button" variant="secondary" onClick={applyCode} loading={checking} disabled={!code.trim() || !basePreview} className="mb-[1px]">Apply</Button>
                </div>
                {applied && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 -mt-2">{applied.code}: {applied.description} applied</p>}

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 space-y-2 text-sm">
                  {preview ? (
                    <>
                      <div className="flex justify-between"><span className="text-slate-500">{preview.days} day{preview.days === 1 ? "" : "s"} × {ksh(vehicle.daily_rate)}</span><span className="font-semibold text-slate-900 dark:text-white">{ksh(preview.subtotal + discount)}</span></div>
                      {discount > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span>Promo discount</span><span className="font-semibold">-{ksh(discount)}</span></div>}
                      <div className="flex justify-between"><span className="text-slate-500">VAT (16%)</span><span className="font-semibold text-slate-900 dark:text-white">{ksh(preview.vat)}</span></div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700"><span className="font-bold text-slate-900 dark:text-white">Total</span><span className="font-black text-emerald-600 dark:text-emerald-400">{ksh(preview.total)}</span></div>
                    </>
                  ) : (
                    <p className="text-slate-500">Choose a return time after pickup to see the price.</p>
                  )}
                </div>

                {(errors.vehicle_id || errors.form) && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.vehicle_id ?? errors.form}</p>}

                <Button type="submit" fullWidth loading={saving} disabled={!preview}>Request booking</Button>
                <p className="text-[11px] text-center text-slate-400">The dealer confirms your booking. Nothing is charged yet.</p>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
