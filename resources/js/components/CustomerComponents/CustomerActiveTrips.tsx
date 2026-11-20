import { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Building2, CalendarClock, Car, CheckCircle2, Clock, FileSignature, Mail, MapPin, Navigation, Phone, Receipt, Satellite, ShieldAlert, XCircle,
} from "lucide-react";
import LoadState from "../LoadState";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { useNow, formatDuration } from "@/lib/useNow";
import { mapsLink, tripPhase } from "@/lib/trip";
import { dateTime, ksh } from "@/lib/format";
import type { CurrentTrip } from "@/types/account";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const TONE: Record<string, string> = {
  blue: "from-blue-600 to-indigo-700 shadow-blue-500/20",
  emerald: "from-emerald-600 to-teal-700 shadow-emerald-500/20",
  amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
  rose: "from-rose-600 to-red-700 shadow-rose-500/20",
};
const card = "p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm";

export default function CustomerActiveTrip() {
  const { data, loading, error, reload } = useApi<CurrentTrip>("/api/trips/current");
  const now = useNow();
  const [message, setMessage] = useState("");

  if (!data) return <LoadState loading={loading} error={error} onRetry={reload} />;
  if (!data.data) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Car className="w-8 h-8" /></div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">No trip coming up</h2>
        <p className="text-slate-500">When you book a vehicle, the pickup details, countdown and dealer contacts appear here.</p>
        <Link to="/customer-browse" className="inline-block px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold">Browse vehicles</Link>
      </div>
    );
  }

  const { booking: b, dealer, vehicle } = data.data;
  const phase = tripPhase(b, now);
  const canCancel = b.allowed_transitions.includes("cancelled");
  const cutoffPassed = new Date(b.cancel_until).getTime() < now;
  const balance = b.invoice?.balance ?? (b.invoice ? 0 : b.total);

  const cancel = async () => {
    if (!window.confirm(`Cancel ${b.reference}? ${b.invoice?.amount_paid ? "The dealer will arrange your refund." : ""}`)) return;
    try {
      await api(`/api/bookings/${b.id}/status`, { method: "PATCH", body: { status: "cancelled" } });
      setMessage("");
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 pb-6">
      <div className="space-y-6">
        <motion.div variants={itemVariants} className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${TONE[phase.tone]} text-white shadow-xl relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-6">
            <span className="px-3 py-1.5 bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> {phase.label}
            </span>
            <span className="text-xs font-mono font-bold text-white/80">{b.reference}</span>
          </div>
          <p className="text-sm font-bold text-white/80 mb-1">{b.status === "active" ? "Your vehicle" : "You're booked in"}</p>
          <h2 className="text-3xl font-black leading-tight">{vehicle?.model ?? "Vehicle"}</h2>
          <p className="text-lg font-mono font-bold text-white/90 mt-1">{vehicle?.plate}</p>
          <div className="mt-6 p-4 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-white/70 tracking-widest mb-1">{phase.countdownLabel}</p>
              <p className="text-2xl font-black font-mono" aria-live="off">{formatDuration(Math.abs(phase.target - now))}</p>
            </div>
            <Clock className="w-8 h-8 text-white/50" />
          </div>
          {data.upcoming > 1 && <p className="text-xs text-white/80 mt-3">You have {data.upcoming - 1} more upcoming booking{data.upcoming > 2 ? "s" : ""} in <Link to="/customer-rentals" className="underline font-bold">My Rentals</Link>.</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <Link to="/customer-support?roadside=1" className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 hover:border-rose-500 shadow-sm group">
            <ShieldAlert className="w-7 h-7 mb-2 text-slate-400 group-hover:text-rose-500" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-rose-500">Report a problem</span>
          </Link>
          {dealer?.phone ? (
            <a href={`tel:${dealer.phone.replace(/\s/g, "")}`} className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 hover:border-blue-500 shadow-sm group">
              <CalendarClock className="w-7 h-7 mb-2 text-slate-400 group-hover:text-blue-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-blue-500 text-center">Call to extend</span>
            </a>
          ) : (
            <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
              <CalendarClock className="w-7 h-7 mb-2 text-slate-300" />
              <span className="text-[11px] font-bold text-slate-500">Ask the dealer to extend</span>
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className={`${card} space-y-4`}>
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-3">Pickup & return</h4>
          {[
            { Icon: CalendarClock, label: "Pickup", value: dateTime(b.pickup_at) },
            { Icon: CalendarClock, label: "Return by", value: dateTime(b.return_at) },
            { Icon: MapPin, label: "Pickup location", value: b.pickup_location },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p><p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p></div>
            </div>
          ))}
          <a href={mapsLink(b.pickup_location, dealer?.city, "Kenya")} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Navigation className="w-4 h-4" /> Directions
          </a>
        </motion.div>
      </div>

      <div className="space-y-6">
        <motion.div variants={itemVariants} className="relative rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#060B18] overflow-hidden min-h-[220px] flex items-center justify-center p-8">
          <div className="absolute inset-0 opacity-[0.12] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative text-center max-w-sm space-y-2">
            <Satellite className="w-10 h-10 mx-auto text-slate-400" />
            <p className="font-black text-slate-800 dark:text-slate-200">Live location isn't available</p>
            <p className="text-sm text-slate-500">DriveFleet isn't connected to a GPS tracking provider yet, so the car's position, speed and fuel can't be shown here.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} className={`${card} space-y-3`}>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Car className="w-4 h-4" /> Vehicle</h4>
            {vehicle?.image_url && <img src={vehicle.image_url} alt={vehicle.model} className="w-full h-36 object-cover rounded-2xl" />}
            <p className="text-sm text-slate-700 dark:text-slate-300">{[vehicle?.year, vehicle?.type, vehicle && `${vehicle.seats} seats`, vehicle?.transmission, vehicle?.fuel_type].filter(Boolean).join(" · ")}</p>
          </motion.div>

          <motion.div variants={itemVariants} className={`${card} space-y-3`}>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Building2 className="w-4 h-4" /> Dealer</h4>
            <p className="font-black text-slate-900 dark:text-white">{dealer?.name}</p>
            {(dealer?.address || dealer?.city) && <p className="text-sm text-slate-600 dark:text-slate-400">{[dealer?.address, dealer?.city].filter(Boolean).join(", ")}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              {dealer?.phone && <a href={`tel:${dealer.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"><Phone className="w-3.5 h-3.5" /> {dealer.phone}</a>}
              {dealer?.email && <a href={`mailto:${dealer.email}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"><Mail className="w-3.5 h-3.5" /> Email</a>}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={`${card} space-y-3`}>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Receipt className="w-4 h-4" /> Payment</h4>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{ksh(b.total)}</p>
            {b.invoice ? (
              balance > 0
                ? <p className="text-sm font-bold text-amber-600">{ksh(balance)} still to pay (invoice {b.invoice.number})</p>
                : <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Paid in full</p>
            ) : <p className="text-sm text-slate-500">You'll get an invoice once the dealer confirms.</p>}
            <Link to="/customer-billing" className="text-xs font-bold text-blue-600 hover:underline">Billing & receipts</Link>
          </motion.div>

          <motion.div variants={itemVariants} className={`${card} space-y-3`}>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FileSignature className="w-4 h-4" /> Agreement & changes</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">{b.agreement_signed ? "Hire agreement signed." : "You'll sign the hire agreement with the dealer at pickup."}</p>
            {canCancel ? (
              <>
                <p className="text-xs text-slate-500">You can cancel yourself until {dateTime(b.cancel_until)}.</p>
                <button onClick={cancel} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10"><XCircle className="w-3.5 h-3.5" /> Cancel booking</button>
              </>
            ) : b.status !== "active" && cutoffPassed ? (
              <p className="text-xs text-slate-500">It's too close to pickup to cancel in the app. Call the dealer if your plans change.</p>
            ) : null}
            {message && <p className="text-sm text-rose-600">{message}</p>}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
