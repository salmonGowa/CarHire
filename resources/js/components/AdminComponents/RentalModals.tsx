import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Camera, CalendarClock, Fuel, Gauge, ShieldCheck } from "lucide-react";
import Button from "../Button";
import Input from "../Input";
import Modal, { MethodPicker } from "../Modal";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/errors";
import { useDebounced } from "@/lib/useDebounced";
import { CHARGE_LABEL, PAYMENT_LABEL, dateTime, ksh } from "@/lib/format";
import type { Booking, ReceivedMethod, ReturnQuote } from "@/types/models";

const METHODS: { id: ReceivedMethod; label: string }[] = (["mpesa", "cash", "card", "bank"] as const).map((id) => ({ id, label: id === "bank" ? "Bank" : PAYMENT_LABEL[id] }));
const needsReference = (m: ReceivedMethod | null) => m === "mpesa" || m === "bank";

type Done = (updated: Booking) => void;
type Errors = Record<string, string>;

/** First error for a field, including per-photo errors (photos.0, photos.1…). */
const photoError = (e: Errors) => e.photos ?? Object.entries(e).find(([k]) => k.startsWith("photos."))?.[1];

function FuelSlider({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5">
        <span className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5" /> Fuel level</span>
        <span className="font-black text-slate-900 dark:text-white">{value}%</span>
      </span>
      <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label="Fuel level" className="w-full accent-blue-600" />
      {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
    </label>
  );
}

function PhotoPicker({ files, onChange, error }: { files: File[]; onChange: (f: File[]) => void; error?: string }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5"><Camera className="w-3.5 h-3.5" /> Condition photos (up to 8)</span>
      <input
        type="file" accept="image/*" multiple aria-label="Condition photos"
        onChange={(e) => onChange(Array.from(e.target.files ?? []).slice(0, 8))}
        className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-500/10 dark:file:text-blue-300 file:font-bold"
      />
      <span className="block text-[11px] text-slate-400 mt-1">{files.length ? `${files.length} photo${files.length === 1 ? "" : "s"} ready` : "Front, back, both sides and any existing marks."}</span>
      {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
    </label>
  );
}

function Notes({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5">Notes</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} maxLength={1000} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
    </label>
  );
}

const Section = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
  <fieldset className="space-y-4">
    <legend className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{icon} {title}</legend>
    {children}
  </fieldset>
);

const Row = ({ label, value, strong, tone }: { label: ReactNode; value: ReactNode; strong?: boolean; tone?: string }) => (
  <div className={`flex justify-between gap-4 text-sm ${strong ? "font-black text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"} ${tone ?? ""}`}>
    <span className="min-w-0">{label}</span><span className="shrink-0">{value}</span>
  </div>
);

function conditionForm(odometer: string, fuel: number, notes: string, photos: File[]) {
  const form = new FormData();
  form.append("odometer", odometer);
  form.append("fuel_level", String(fuel));
  if (notes.trim()) form.append("notes", notes.trim());
  photos.forEach((p) => form.append("photos[]", p));
  return form;
}

// ── Handover ──────────────────────────────────────────────────────────────────

export function HandoverModal({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: Done }) {
  return (
    <Modal open={!!booking} onClose={onClose} title="Hand over keys" width="max-w-xl"
      subtitle={booking && <>{booking.reference} · {booking.customer.name} · {booking.vehicle?.model} ({booking.vehicle?.plate})</>}>
      {booking && <HandoverForm key={booking.id} booking={booking} onClose={onClose} onDone={onDone} />}
    </Modal>
  );
}

function HandoverForm({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: Done }) {
  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState(100);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [deposit, setDeposit] = useState(String(booking.deposit.amount));
  const [method, setMethod] = useState<ReceivedMethod | null>(booking.deposit.amount > 0 ? "mpesa" : null);
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const depositNum = Number(deposit) || 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const form = conditionForm(odometer, fuel, notes, photos);
    form.append("deposit_received", String(depositNum));
    if (depositNum > 0 && method) form.append("deposit_method", method);
    if (depositNum > 0 && reference.trim()) form.append("deposit_reference", reference.trim());
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api<{ data: Booking }>(`/api/bookings/${booking.id}/handover`, { method: "POST", form });
      onDone(data);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-6">
      <Section title="Condition at pickup" icon={<Gauge className="w-3.5 h-3.5" />}>
        <Input label="Odometer (km)" type="number" min={0} value={odometer} onChange={(e) => setOdometer(e.target.value)} required error={errors.odometer} />
        <FuelSlider value={fuel} onChange={setFuel} error={errors.fuel_level} />
        <PhotoPicker files={photos} onChange={setPhotos} error={photoError(errors)} />
        <Notes value={notes} onChange={setNotes} placeholder="Existing scratches, spare tyre, accessories handed over…" />
      </Section>

      <Section title="Security deposit" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
        <Input label={`Deposit received (KSh)${booking.deposit.amount ? ` · policy ${ksh(booking.deposit.amount)}` : ""}`} type="number" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} error={errors.deposit_received} />
        {depositNum > 0 && (
          <>
            <MethodPicker label="Deposit paid by" value={method} options={METHODS} onChange={setMethod} error={errors.deposit_method} />
            {needsReference(method) && (
              <Input label={method === "mpesa" ? "M-PESA code" : "Bank reference"} value={reference} onChange={(e) => setReference(e.target.value)} required error={errors.deposit_reference} />
            )}
          </>
        )}
        <p className="text-[11px] text-slate-400">The deposit is held by you, not DriveFleet. At return it first covers any balance or charges; the rest goes back to the customer.</p>
      </Section>

      {(errors.form || errors.booking) && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form ?? errors.booking}</p>}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" loading={saving} className="flex-1">Hand over keys</Button>
      </div>
    </form>
  );
}

// ── Return ────────────────────────────────────────────────────────────────────

export function ReturnModal({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: Done }) {
  return (
    <Modal open={!!booking} onClose={onClose} title="Check the car back in" width="max-w-2xl"
      subtitle={booking && <>{booking.reference} · {booking.customer.name} · due back {dateTime(booking.return_at)}</>}>
      {booking && <ReturnForm key={booking.id} booking={booking} onClose={onClose} onDone={onDone} />}
    </Modal>
  );
}

function ReturnForm({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: Done }) {
  const pickup = booking.inspections?.pickup;
  const [odometer, setOdometer] = useState(pickup ? String(pickup.odometer) : "");
  const [fuel, setFuel] = useState(pickup?.fuel_level ?? 100);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [damage, setDamage] = useState("");
  const [damageNote, setDamageNote] = useState("");
  const [holdDeposit, setHoldDeposit] = useState(false);
  const [method, setMethod] = useState<ReceivedMethod | null>(booking.deposit.method);
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // Live price of the return, re-quoted as the readings change.
  const params = useDebounced(new URLSearchParams({ odometer, fuel_level: String(fuel), ...(Number(damage) > 0 && { damage_amount: damage }) }).toString(), 350);
  const [quote, setQuote] = useState<{ key: string; data: ReturnQuote } | null>(null);
  const [quoteError, setQuoteError] = useState<{ key: string; message: string } | null>(null);
  useEffect(() => {
    if (!/odometer=\d+/.test(params)) return;
    let live = true;
    api<{ data: ReturnQuote }>(`/api/bookings/${booking.id}/return-quote?${params}`)
      .then(({ data }) => live && setQuote({ key: params, data }))
      .catch((err) => live && setQuoteError({ key: params, message: Object.values(fieldErrors(err))[0] }));
    return () => { live = false; };
  }, [params, booking.id]);
  const q = quote?.data;
  const odometerLow = pickup && odometer !== "" && Number(odometer) < pickup.odometer;
  const refund = holdDeposit ? 0 : (q?.deposit_refund ?? 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const form = conditionForm(odometer, fuel, notes, photos);
    if (Number(damage) > 0) {
      form.append("damage_amount", damage);
      form.append("damage_description", damageNote.trim());
    }
    form.append("settle_deposit", holdDeposit ? "0" : "1");
    if (!holdDeposit && refund > 0 && method) {
      form.append("refund_method", method);
      if (reference.trim()) form.append("refund_reference", reference.trim());
    }
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api<{ data: Booking }>(`/api/bookings/${booking.id}/return`, { method: "POST", form });
      onDone(data);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="space-y-6">
        <Section title="Condition at return" icon={<Gauge className="w-3.5 h-3.5" />}>
          <Input label={`Odometer (km)${pickup ? ` · ${pickup.odometer.toLocaleString()} at pickup` : ""}`} type="number" min={pickup?.odometer ?? 0} value={odometer} onChange={(e) => setOdometer(e.target.value)} required
            error={errors.odometer ?? (odometerLow ? "That's lower than at pickup." : undefined)} />
          <FuelSlider value={fuel} onChange={setFuel} error={errors.fuel_level} />
          {pickup && <p className="text-[11px] text-slate-400 -mt-2">Collected with {pickup.fuel_level}% fuel.</p>}
          <PhotoPicker files={photos} onChange={setPhotos} error={photoError(errors)} />
          <Notes value={notes} onChange={setNotes} placeholder="Anything different from pickup…" />
        </Section>
        <Section title="Damage (optional)" icon={<Camera className="w-3.5 h-3.5" />}>
          <Input label="Damage charge before VAT (KSh)" type="number" min={0} value={damage} onChange={(e) => setDamage(e.target.value)} error={errors.damage_amount} />
          {Number(damage) > 0 && <Input label="What was damaged" value={damageNote} onChange={(e) => setDamageNote(e.target.value)} required error={errors.damage_description} />}
        </Section>
      </div>

      <div className="space-y-5">
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5" aria-live="polite">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Return charges</p>
          {!q ? (
            <p className="text-sm text-slate-400">{quoteError?.key === params ? quoteError.message : "Enter the odometer to see charges."}</p>
          ) : q.charges.length === 0 ? (
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">No extra charges. Back on time, full enough and within the mileage.</p>
          ) : (
            q.charges.map((c) => (
              <div key={c.type}>
                <Row label={<span className="font-bold text-slate-800 dark:text-slate-200">{CHARGE_LABEL[c.type]}</span>} value={ksh(c.total)} />
                <p className="text-[11px] text-slate-400 leading-snug">{c.description} · incl. VAT</p>
              </div>
            ))
          )}
          {q && (
            <div className="pt-2.5 mt-1 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <Row label="Charges" value={ksh(q.charges_total)} />
              <Row label="Customer owes in total" value={ksh(q.balance_after)} strong />
            </div>
          )}
        </div>

        <Section title="Deposit" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
          {booking.deposit.held === 0 ? (
            <p className="text-sm text-slate-500">No deposit was taken for this rental.</p>
          ) : (
            <>
              <Row label="Held" value={ksh(booking.deposit.held)} />
              {!holdDeposit && q && (
                <>
                  <Row label="Used for what's owed" value={ksh(q.deposit_to_apply)} />
                  <Row label="Back to the customer" value={ksh(q.deposit_refund)} strong tone="text-emerald-600 dark:text-emerald-400" />
                  {q.balance_after > q.deposit_to_apply && <Row label="Still to collect" value={ksh(q.balance_after - q.deposit_to_apply)} tone="text-amber-600 dark:text-amber-400" />}
                </>
              )}
              <label className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" checked={holdDeposit} onChange={(e) => setHoldDeposit(e.target.checked)} className="mt-0.5 accent-blue-600" />
                <span>Hold the deposit for now (for example, while a damage quote comes in). Settle it later from the Booking Manager.</span>
              </label>
              {refund > 0 && (
                <>
                  <MethodPicker label={`Returned ${ksh(refund)} by`} value={method} options={METHODS} onChange={setMethod} error={errors.refund_method} />
                  {needsReference(method) && <Input label={method === "mpesa" ? "M-PESA code" : "Bank reference"} value={reference} onChange={(e) => setReference(e.target.value)} error={errors.refund_reference} />}
                </>
              )}
            </>
          )}
        </Section>

        {(errors.form || errors.booking || errors.deposit) && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form ?? errors.booking ?? errors.deposit}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!!odometerLow || (refund > 0 && !method)} className="flex-1">Complete return</Button>
        </div>
      </div>
    </form>
  );
}

// ── Deposit settlement (held back at return, or a cancelled booking) ─────────

export function SettleDepositModal({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: Done }) {
  return (
    <Modal open={!!booking} onClose={onClose} title="Settle deposit" subtitle={booking && <>{booking.reference} · {booking.customer.name}</>} width="max-w-md">
      {booking && <SettleForm key={booking.id} booking={booking} onDone={onDone} />}
    </Modal>
  );
}

function SettleForm({ booking, onDone }: { booking: Booking; onDone: Done }) {
  const held = booking.deposit.held;
  const owed = booking.status === "completed" ? Math.max(0, booking.invoice?.balance ?? 0) : 0;
  const apply = Math.min(held, owed);
  const refund = held - apply;
  const [method, setMethod] = useState<ReceivedMethod | null>(booking.deposit.method);
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api<{ data: Booking }>(`/api/bookings/${booking.id}/deposit/settle`, {
        method: "POST", body: refund > 0 ? { refund_method: method, refund_reference: reference.trim() || null } : {},
      });
      onDone(data);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      <div className="space-y-1.5">
        <Row label="Deposit held" value={ksh(held)} />
        {booking.status === "completed" && <Row label="Used for the balance due" value={ksh(apply)} />}
        <Row label="Back to the customer" value={ksh(refund)} strong tone="text-emerald-600 dark:text-emerald-400" />
      </div>
      {booking.status === "cancelled" && <p className="text-xs text-slate-500">The booking was cancelled, so the whole deposit goes back.</p>}
      {refund > 0 && (
        <>
          <MethodPicker label="Returned by" value={method} options={METHODS} onChange={setMethod} error={errors.refund_method} />
          {needsReference(method) && <Input label={method === "mpesa" ? "M-PESA code" : "Bank reference"} value={reference} onChange={(e) => setReference(e.target.value)} error={errors.refund_reference} />}
        </>
      )}
      {(errors.form || errors.deposit) && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form ?? errors.deposit}</p>}
      <Button type="submit" fullWidth loading={saving} disabled={refund > 0 && !method}>Settle deposit</Button>
      <p className="text-[11px] text-center text-slate-400">Records money already returned. It doesn't send anything.</p>
    </form>
  );
}

// ── Extension request from the customer ──────────────────────────────────────

export function ExtensionModal({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone: Done }) {
  return (
    <Modal open={!!booking?.extension} onClose={onClose} title="Extension request" width="max-w-md"
      subtitle={booking && <>{booking.reference} · {booking.customer.name}</>}>
      {booking?.extension && <ExtensionForm key={booking.extension.id} booking={booking} onDone={onDone} />}
    </Modal>
  );
}

function ExtensionForm({ booking, onDone }: { booking: Booking; onDone: Done }) {
  const ext = booking.extension!;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState("");

  const decide = async (decision: "approve" | "decline") => {
    setBusy(decision);
    setError("");
    try {
      const { data } = await api<{ data: Booking }>(`/api/booking-extensions/${ext.id}/decide`, { method: "POST", body: { decision, note: note.trim() || null } });
      onDone(data);
    } catch (err) {
      setError(Object.values(fieldErrors(err))[0]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 space-y-1.5">
        <p className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300"><CalendarClock className="w-4 h-4" /> Keep the car until {dateTime(ext.to_return_at)}</p>
        <Row label="Currently due back" value={dateTime(booking.return_at)} />
        <Row label={`${ext.extra_days} extra day${ext.extra_days === 1 ? "" : "s"} at ${ksh(booking.daily_rate)}`} value={`${ksh(ext.amount)} incl. VAT`} strong />
      </div>
      <Notes value={note} onChange={setNote} placeholder="Optional message to the customer" />
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex gap-3">
        <Button variant="danger" onClick={() => decide("decline")} loading={busy === "decline"} disabled={!!busy} className="flex-1">Decline</Button>
        <Button variant="primary" onClick={() => decide("approve")} loading={busy === "approve"} disabled={!!busy} className="flex-1">Approve</Button>
      </div>
      <p className="text-[11px] text-center text-slate-400">Approving moves the return time and adds {ksh(ext.amount)} to the invoice. The customer gets a text either way.</p>
    </div>
  );
}
