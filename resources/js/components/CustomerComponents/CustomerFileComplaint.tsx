import { useState, type FormEvent, type ReactNode } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { 
  AlertOctagon, FileText, UploadCloud, Send, 
  CheckCircle2, Info, ChevronLeft, MessageSquareWarning,
  Clock, ShieldCheck
} from "lucide-react";

// --- Mock Data ---
const RECENT_BOOKINGS = [
  { id: "BK-1044", desc: "Mazda CX-5 (May 12 - May 15)" },
  { id: "BK-1019", desc: "Toyota Corolla (Feb 10 - Feb 14)" },
];

const COMPLAINT_TYPES = [
  { value: "vehicle_condition", label: "Vehicle Condition / Cleanliness" },
  { value: "dealer_behavior", label: "Dealership Service / Staff Behavior" },
  { value: "billing_issue", label: "Billing / Overcharge Issue" },
  { value: "accident_breakdown", label: "Accident / Mechanical Breakdown" },
  { value: "other", label: "Other / General Feedback" },
];

// --- Reusable UI Elements ---
const Card = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm ${className}`}>
    {children}
  </div>
);

const Input = ({ label, value, onChange, placeholder = "", required = false }: { label: ReactNode; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <input 
      type="text" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" 
    />
  </div>
);

// --- Main Component ---
export default function CustomerFileComplaint() {
  const [formData, setFormData] = useState({
    type: "",
    bookingId: "",
    subject: "",
    description: "",
    priority: "Medium",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const set = (key: keyof typeof formData, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API Call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 2000);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setFormData({ type: "", bookingId: "", subject: "", description: "", priority: "Medium" });
    setFiles([]);
  };

  // Animation variants
  const fade: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } } };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
      
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={fade} className="mb-8">
        <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors mb-4">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <MessageSquareWarning className="text-rose-500" size={28} />
          File a Complaint
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          We take your experience seriously. Please provide the details of your issue below, and our specialized Support Team will investigate immediately.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          /* --- SUCCESS STATE --- */
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
              <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Complaint Submitted Successfully</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              Your ticket <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#TK-88921</span> has been created. A support specialist will contact you via email within 24 hours.
            </p>
            <button 
              onClick={handleReset}
              className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-xl hover:scale-105 transition-transform"
            >
              Return to Dashboard
            </button>
          </motion.div>
        ) : (
          /* --- FORM STATE --- */
          <motion.div 
            key="form"
            initial="hidden" 
            animate="show" 
            exit={{ opacity: 0, y: -20 }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }} 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <motion.div variants={fade}>
                  <Card className="p-6 space-y-6">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-4">
                      Incident Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                          Complaint Category <span className="text-rose-500">*</span>
                        </label>
                        <select 
                          required
                          value={formData.type} 
                          onChange={e => set("type", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Select category...</option>
                          {COMPLAINT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                          Related Booking (Optional)
                        </label>
                        <select 
                          value={formData.bookingId} 
                          onChange={e => set("bookingId", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">None / General Issue</option>
                          {RECENT_BOOKINGS.map(b => <option key={b.id} value={b.id}>{b.id} — {b.desc}</option>)}
                        </select>
                      </div>
                    </div>

                    <Input 
                      label="Subject" 
                      required 
                      placeholder="Brief summary of the issue..." 
                      value={formData.subject} 
                      onChange={v => set("subject", v)} 
                    />

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                        Detailed Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea 
                        required
                        rows={6}
                        placeholder="Please provide as much detail as possible to help us investigate..."
                        value={formData.description}
                        onChange={e => set("description", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </Card>
                </motion.div>

                {/* Priority Selector */}
                <motion.div variants={fade}>
                  <Card className="p-6">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                      Severity Level
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { level: "Low", desc: "Minor inconvenience", color: "border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10" },
                        { level: "Medium", desc: "Service impacted", color: "border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10" },
                        { level: "High", desc: "Urgent safety/financial", color: "border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10" }
                      ].map(p => (
                        <button
                          key={p.level}
                          type="button"
                          onClick={() => set("priority", p.level)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            formData.priority === p.level 
                            ? `${p.color} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#0B1120] ${p.color.split(' ')[0].replace('border', 'ring')}` 
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <span className="block font-bold text-sm mb-0.5">{p.level}</span>
                          <span className="block text-[10px] opacity-80 truncate">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                {/* File Upload Placeholder */}
                <motion.div variants={fade}>
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Evidence / Attachments
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Optional</span>
                    </div>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG or PDF (MAX. 10MB)</p>
                      </div>
                      <input type="file" className="hidden" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
                    </label>
                    {files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {files.map((f, i) => (
                          <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-100 dark:border-blue-800">
                            <FileText size={12} /> {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>

                {/* Submit Action */}
                <motion.div variants={fade} className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Submit Complaint <Send size={16} /></>
                    )}
                  </button>
                </motion.div>

              </form>
            </div>

            {/* Right Column: Info & Process */}
            <motion.div variants={fade} className="space-y-6">
              
              <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50">
                <h3 className="text-sm font-black text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-4">
                  <Info size={16} className="text-blue-600 dark:text-blue-400" />
                  What happens next?
                </h3>
                <div className="relative pl-5 space-y-5 before:absolute before:left-1.5 before:top-1.5 before:bottom-2 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-800">
                  <div className="relative text-sm">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500 ring-4 ring-blue-50 dark:ring-[#0f172a]" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">1. Ticket Created</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">You will receive an email confirmation with your tracking ID.</p>
                  </div>
                  <div className="relative text-sm">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-blue-50 dark:ring-[#0f172a]" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">2. Investigation</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">Our resolution team will review the details and contact the dealership.</p>
                  </div>
                  <div className="relative text-sm">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-blue-50 dark:ring-[#0f172a]" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">3. Resolution</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">We aim to resolve all complaints within 24-48 business hours.</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">
                  Need immediate help?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Emergency Hotline</p>
                      <p className="text-xs font-mono mt-0.5 text-slate-500 dark:text-slate-400">0800 111 222</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">Support Hours</p>
                      <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">24/7 for active bookings.</p>
                    </div>
                  </div>
                </div>
              </Card>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}