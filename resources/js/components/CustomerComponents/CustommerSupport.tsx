import { useState } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ChevronDown, LifeBuoy, Mail, Phone, ShieldAlert } from "lucide-react";
import SupportDesk from "../SupportDesk";
import { appConfig } from "@/lib/appConfig";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const { platform } = appConfig;

// Answers come from the platform's actual rules (System Settings), not boilerplate.
const FAQS = [
  {
    q: "Can I cancel a booking?",
    a: platform.free_cancellation_hours > 0
      ? `Yes, from My Rentals, up to ${platform.free_cancellation_hours} hours before pickup. Closer to pickup, contact the dealer; they decide on any refund.`
      : "Yes, from My Rentals, any time before pickup. If you've already paid, the dealer arranges the refund.",
  },
  {
    q: "How long can I rent for?",
    a: `Bookings in the app run from ${platform.min_booking_hours} hours to ${platform.max_booking_days} days. For longer hires, contact the dealer directly.`,
  },
  {
    q: "Why do I need to upload my ID?",
    a: `Dealers need to know who is driving. Upload your national ID or passport and driving licence under Profile; verification usually takes a working day. Drivers must be at least ${platform.min_driver_age}.`,
  },
  {
    q: "How do I pay?",
    a: "Pay the dealer by M-PESA (quote your booking reference), or by card or cash at the counter. Every payment shows up with a receipt under Billing & Payments.",
  },
  {
    q: "What about fuel, mileage and late returns?",
    a: "These are set by each dealer and written into the hire agreement you sign at pickup. Check it under My Rentals, or ask the dealer before you drive off.",
  },
];

export default function CustomerSupport() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [params] = useSearchParams();
  // "Report a problem" on Live Trip links here with ?roadside=1.
  const [startNew, setStartNew] = useState<{ key: number; category?: string; subject?: string } | null>(() =>
    params.get("roadside") ? { key: 0, category: "Roadside Assistance", subject: "Problem with my rental" } : null);

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Help & Support</h2>
        <p className="text-sm text-slate-500 mt-1">Questions about a booking, a payment or the car? Raise a ticket and the DriveFleet team replies here.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <AlertTriangle className="absolute -left-10 -bottom-10 w-48 h-48 text-white/10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><LifeBuoy className="w-7 h-7" /></div>
          <div>
            <h3 className="text-2xl font-black mb-1">Breakdown or accident?</h3>
            <p className="text-rose-100 text-sm font-medium">If anyone is hurt or in danger, call 999 or 112 first. Then tell us here; roadside requests go to the top of the queue.</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button onClick={() => setStartNew({ key: Date.now(), category: "Roadside Assistance", subject: "Roadside help needed" })}
            className="px-6 py-3.5 bg-white text-rose-600 hover:bg-rose-50 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Get roadside help
          </button>
          {platform.support_phone && (
            <a href={`tel:${platform.support_phone.replace(/\s/g, "")}`} className="px-6 py-3.5 bg-white/15 hover:bg-white/25 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> Call {platform.support_phone}
            </a>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SupportDesk bookingsPath="/api/bookings?per_page=50" startNew={startNew} />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Quick answers</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {FAQS.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between gap-4 py-4 text-left text-sm font-bold text-slate-800 dark:text-slate-200">
                  {f.q} <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-4 text-sm text-slate-600 dark:text-slate-400">
                      {f.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Other ways to reach us</h3>
          {platform.support_email || platform.support_phone ? (
            <>
              {platform.support_email && <a href={`mailto:${platform.support_email}`} className="flex items-center gap-3 text-sm font-bold text-blue-600 hover:underline"><Mail className="w-4 h-4" /> {platform.support_email}</a>}
              {platform.support_phone && <a href={`tel:${platform.support_phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-sm font-bold text-blue-600 hover:underline"><Phone className="w-4 h-4" /> {platform.support_phone}</a>}
            </>
          ) : <p className="text-sm text-slate-500">Tickets are the quickest way to reach us.</p>}
          <p className="text-sm text-slate-500">Unhappy with a dealer or a vehicle? <Link to="/customer-complaint" className="text-blue-600 font-bold hover:underline">File a complaint</Link> so we can follow it up formally.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
