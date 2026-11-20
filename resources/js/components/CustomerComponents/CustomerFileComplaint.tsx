import { useState, type FormEvent, type ReactNode } from "react";
import { type Variants, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileWarning, Info, Scale } from "lucide-react";
import AttachmentPicker from "../AttachmentPicker";
import Button from "../Button";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/errors";
import { attachmentError, ticketForm } from "@/lib/support";
import { useApi } from "@/lib/useApi";
import { longDate } from "@/lib/format";
import type { Booking, Paginated } from "@/types/models";
import type { SupportTicket } from "@/types/platform";

const COMPLAINT_TYPES = [
  { value: "Vehicle condition or cleanliness", priority: "medium" },
  { value: "Dealer service or staff behaviour", priority: "medium" },
  { value: "Billing or overcharge", priority: "high" },
  { value: "Accident or mechanical breakdown", priority: "high" },
  { value: "Something else", priority: "low" },
];
const OUTCOMES = ["A refund or partial refund", "An apology or explanation", "A replacement vehicle", "Just letting you know"];

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";

const Field = ({ label, error, children }: { label: string; error?: string; children: ReactNode }) => (
  <label className="block">
    <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">{label}</span>
    {children}
    {error && <span className="block text-xs text-rose-500 mt-1">{error}</span>}
  </label>
);

export default function CustomerFileComplaint() {
  const { data: bookings } = useApi<Paginated<Booking>>("/api/bookings?per_page=50");
  const [form, setForm] = useState({ type: COMPLAINT_TYPES[0].value, booking_id: "", outcome: OUTCOMES[0], details: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [filed, setFiled] = useState<SupportTicket | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const booking = bookings?.data.find((b) => String(b.id) === form.booking_id);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.details.trim().length < 20) {
      setErrors({ details: "Tell us a bit more (at least 20 characters) so we can act on it." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ data: SupportTicket }>("/api/support-tickets", {
        method: "POST",
        form: ticketForm({
          category: "Complaint",
          priority: COMPLAINT_TYPES.find((t) => t.value === form.type)?.priority ?? "medium",
          subject: `${form.type}${booking ? ` · ${booking.reference}` : ""}`,
          booking_id: form.booking_id || null,
          body: `${form.details.trim()}\n\nWhat I'd like: ${form.outcome}`,
        }, files),
      });
      setFiled(res.data);
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (filed) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto mt-10 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-8 h-8" /></div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Complaint received</h2>
        <p className="text-slate-600 dark:text-slate-400">Your reference is <span className="font-mono font-black text-slate-900 dark:text-white">{filed.reference}</span>. The DriveFleet team will look into it and reply under Help &amp; Support. You'll get a notification when they do.</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/customer-support" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold">View my tickets</Link>
          <button onClick={() => { setFiled(null); setForm({ ...form, details: "", booking_id: "" }); setFiles([]); }} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300">File another</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show" className="space-y-8 pb-10">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3"><FileWarning className="w-8 h-8 text-rose-500" /> File a Complaint</h1>
        <p className="text-sm text-slate-500 mt-1">Formal complaints are handled by DriveFleet, not the dealer, and every one gets a reference and a reply.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.form variants={itemVariants} onSubmit={submit} className="lg:col-span-2 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="What is it about?">
              <select value={form.type} onChange={set("type")} className={inputClass}>{COMPLAINT_TYPES.map((t) => <option key={t.value}>{t.value}</option>)}</select>
            </Field>
            <Field label="Which booking?" error={errors.booking_id}>
              <select value={form.booking_id} onChange={set("booking_id")} className={inputClass}>
                <option value="">Not about a booking</option>
                {(bookings?.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.reference} · {b.vehicle?.model ?? "Vehicle"} · {longDate(b.pickup_at)}</option>)}
              </select>
            </Field>
          </div>
          {form.type.startsWith("Accident") && (
            <p className="flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> If this is happening right now, use <Link to="/customer-support" className="font-bold underline">Get roadside help</Link> instead, and call 999 or 112 if anyone is hurt.
            </p>
          )}
          <Field label="What happened?" error={errors.details ?? errors.body}>
            <textarea value={form.details} onChange={set("details")} rows={6} className={`${inputClass} resize-none`}
              placeholder="When and where it happened, who you dealt with, and what went wrong." />
          </Field>
          <Field label="What would put it right?">
            <select value={form.outcome} onChange={set("outcome")} className={inputClass}>{OUTCOMES.map((o) => <option key={o}>{o}</option>)}</select>
          </Field>
          <div>
            <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Evidence (optional)</span>
            <AttachmentPicker files={files} onChange={setFiles} error={attachmentError(errors)} />
          </div>
          {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" disabled={submitting} className="px-8 mt-4">{submitting ? "Sending…" : "Submit Complaint"}</Button>
          </div>
        </motion.form>

        <motion.aside variants={itemVariants} className="space-y-6">
          <div className="p-6 rounded-[2rem] bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
            <h3 className="text-sm font-black text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-3"><Scale className="w-4 h-4" /> What happens next</h3>
            <ol className="space-y-2 text-sm text-blue-900/80 dark:text-blue-100/80 list-decimal list-inside">
              <li>We read it and may ask you questions in the ticket.</li>
              <li>We talk to the dealer and look at the booking, payments and agreement.</li>
              <li>We reply with what we found and what will be done.</li>
            </ol>
          </div>
          <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] text-sm text-slate-600 dark:text-slate-400 flex gap-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" /> Photos of damage, receipts or messages help most. Files are only seen by you and the DriveFleet team.
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}
