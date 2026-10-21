import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ksh, quote } from "@/lib/format";
import type { Booking, Paginated, PaymentMethod, Vehicle } from "@/types/models";
import { type Variants, motion } from "framer-motion";
import Input from "../Input"; // Adjust path as necessary
import Button from "../Button"; // Adjust path as necessary
import { 
  User, Car, Calendar, MapPin, 
  CheckCircle2, ShieldCheck, FileText, Phone, Mail, FileDigit
} from "lucide-react";

const LOCATIONS = ["Nairobi CBD", "JKIA Airport", "Mombasa Airport", "Kisumu Branch", "Eldoret Branch", "Nakuru Branch"];

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "mpesa", label: "M-PESA" },
  { id: "card", label: "Card" },
  { id: "cash", label: "Cash" },
  { id: "pay_later", label: "Pay Later" },
];

const EMPTY_FORM = {
  firstName: "", lastName: "", phone: "", email: "", idNumber: "",
  vehicleId: "", pickupDate: "", pickupTime: "10:00", returnDate: "", returnTime: "10:00",
  location: "Nairobi CBD", paymentMethod: "mpesa" as PaymentMethod, promoCode: "",
};

// --- Animations ---
const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminAddBooking() {
  const navigate = useNavigate();
  const { data: fleet } = useApi<Paginated<Vehicle>>("/api/vehicles?per_page=100");
  // Rented cars can still be booked for later dates; workshop cars can't.
  const vehicles = (fleet?.data ?? []).filter((v) => v.status !== "maintenance");

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Booking | null>(null);

  const pickupAt = formData.pickupDate ? `${formData.pickupDate}T${formData.pickupTime}` : "";
  const returnAt = formData.returnDate ? `${formData.returnDate}T${formData.returnTime}` : "";

  // Derived state for the live summary (the server recalculates on submit)
  const selectedVehicle = vehicles.find(v => String(v.id) === formData.vehicleId);
  const preview = selectedVehicle && pickupAt && returnAt ? quote(selectedVehicle.daily_rate, pickupAt, returnAt) : null;
  const estimatedDays = preview?.days ?? 0;
  const subtotal = preview?.subtotal ?? 0;
  const vat = preview?.vat ?? 0;
  const grandTotal = preview?.total ?? 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api<{ data: Booking }>("/api/bookings", {
        method: "POST",
        body: {
          vehicle_id: Number(formData.vehicleId),
          pickup_at: pickupAt,
          return_at: returnAt,
          pickup_location: formData.location,
          payment_method: formData.paymentMethod,
          customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
          customer_phone: formData.phone,
          customer_email: formData.email || null,
          customer_id_number: formData.idNumber,
          promo_code: formData.promoCode || null,
        },
      });
      setCreated(data);
      setFormData(EMPTY_FORM);
    } catch (err) {
      setErrors(err instanceof ApiError
        ? { ...Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])), ...(Object.keys(err.errors).length ? {} : { form: err.message }) }
        : { form: "Couldn't reach the server. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manual Booking</h2>
          <p className="text-sm text-slate-500">Create a new reservation for walk-in or phone-in clients.</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ── Left Column: Booking Form ── */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Section 1: Client Details */}
          <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Client Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input error={errors.customer_name} label="First Name" placeholder="e.g. John" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
              <Input label="Last Name" placeholder="e.g. Doe" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
              <div className="relative">
                <Phone className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
                <Input error={errors.customer_phone} label="Phone Number" placeholder="07XX XXX XXX" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div className="relative">
                <Mail className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
                <Input error={errors.customer_email} label="Email Address" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="sm:col-span-2 relative">
                <FileDigit className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
                <Input error={errors.customer_id_number} label="National ID / Passport Number" placeholder="Required for verification" value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} required />
              </div>
            </div>
          </motion.div>

          {/* Section 2: Trip & Vehicle Details */}
          <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Trip & Vehicle Selection</h3>
            </div>

            <div className="space-y-6">
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Pickup Location</label>
                 <div className="relative">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <select 
                     value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})}
                     className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 appearance-none"
                   >
                     {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                   </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <p className="text-xs font-black uppercase text-blue-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Pickup Schedule</p>
                  <Input error={errors.pickup_at} label="Date" type="date" value={formData.pickupDate} onChange={(e) => setFormData({...formData, pickupDate: e.target.value})} required />
                  <Input label="Time" type="time" value={formData.pickupTime} onChange={(e) => setFormData({...formData, pickupTime: e.target.value})} required />
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <p className="text-xs font-black uppercase text-rose-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Return Schedule</p>
                  <Input error={errors.return_at} label="Date" type="date" value={formData.returnDate} onChange={(e) => setFormData({...formData, returnDate: e.target.value})} required />
                  <Input label="Time" type="time" value={formData.returnTime} onChange={(e) => setFormData({...formData, returnTime: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Assign Vehicle</label>
                <select 
                  value={formData.vehicleId} onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200"
                  required
                >
                  <option value="" disabled>-- Select an available vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} ({v.plate}) - {ksh(v.daily_rate)}/day{v.status === "rented" ? " · currently out" : ""}</option>
                  ))}
                </select>
                {errors.vehicle_id && <p className="text-xs text-rose-500 mt-1.5">{errors.vehicle_id}</p>}
              </div>
              <div>
                <Input label="Promo code (optional)" value={formData.promoCode} onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })} placeholder="Applied and checked when you confirm" error={errors.promo_code} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Right Column: Booking Summary & Payment ── */}
        <motion.div variants={itemVariants} className="xl:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-xl shadow-slate-200/20 dark:shadow-black/40">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Booking Summary
              </h3>

              {/* Client Preview */}
              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : "Pending Details..."}
                </p>
                {formData.phone && <p className="text-xs text-slate-500 mt-0.5">{formData.phone}</p>}
              </div>

              {/* Vehicle & Duration Preview */}
              <div className="mb-6 pb-6 border-b border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle & Duration</p>
                {selectedVehicle ? (
                  <>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedVehicle.model}</p>
                    <p className="text-xs font-mono text-blue-500 font-bold mt-0.5">{selectedVehicle.plate}</p>
                    <p className="text-xs text-slate-500 mt-2">{estimatedDays > 0 ? `${estimatedDays} Days` : "Dates pending"} @ {ksh(selectedVehicle.daily_rate)}/day</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">No vehicle selected</p>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{ksh(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">VAT (16%)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{ksh(vat)}</span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-black text-slate-900 dark:text-white">Grand Total</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{ksh(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(({ id: method, label }) => (
                    <button
                      key={method}
                      type="button"
                      aria-pressed={formData.paymentMethod === method}
                      onClick={() => setFormData({...formData, paymentMethod: method})}
                      className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                        formData.paymentMethod === method 
                          ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400" 
                          : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {created && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400">
                  <p className="font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Booking {created.reference} created</p>
                  <p className="mt-0.5">{created.customer.name} · {created.vehicle?.model} · {ksh(created.total)}</p>
                  <button type="button" onClick={() => navigate("/dealer-booking")} className="mt-2 font-semibold underline">Open in Booking Manager</button>
                </div>
              )}
              {errors.form && <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
              <Button fullWidth type="submit" loading={saving} className="py-4 text-sm shadow-xl shadow-blue-500/20">
                Confirm & Create Booking
              </Button>
              <p className="text-[10px] text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure internal booking portal
              </p>
            </div>
            
          </div>
        </motion.div>
      </form>

    </motion.div>
  );
}