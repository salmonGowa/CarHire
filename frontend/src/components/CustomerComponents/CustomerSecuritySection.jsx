import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button";
import Input from "../Input";
import { 
  Lock, CheckCircle2, AlertTriangle, Smartphone, 
  MonitorSmartphone, Laptop, ChevronDown, Trash2, 
  ShieldCheck, KeyRound, LogOut, X, ShieldAlert
} from "lucide-react";

// --- Mock Data ---
const ACTIVE_SESSIONS = [
  { id: 1, device: "MacBook Pro - Safari", location: "Nairobi, KE", time: "Active Now", type: "desktop", current: true },
  { id: 2, device: "iPhone 14 Pro - App", location: "Nairobi, KE", time: "2 hours ago", type: "mobile", current: false },
  { id: 3, device: "Windows PC - Chrome", location: "Mombasa, KE", time: "3 days ago", type: "desktop", current: false },
];

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SecuritySection() {
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [twoFA, setTwoFA] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  
  // Delete Modal State
  const [showDeleteModal, setDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // --- Password Strength Logic ---
  const strength = (() => {
    const p = pwForm.next;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabels = ["Too Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-slate-200 dark:bg-slate-700", "bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];
  const strengthTextColors = ["text-slate-400", "text-rose-500", "text-amber-500", "text-blue-500", "text-emerald-500"];

  // --- Handlers ---
  const showToastMsg = (message, icon = "check") => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const savePw = async () => {
    const e = {};
    if (!pwForm.current) e.current = "Required";
    if (!pwForm.next || pwForm.next.length < 8) e.next = "Min 8 characters";
    if (pwForm.next !== pwForm.confirm) e.confirm = "Passwords don't match";
    
    setPwErrors(e);
    if (Object.keys(e).length) return;
    
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900)); // Simulate API call
    setSaving(false);
    
    showToastMsg("Password updated successfully");
    setPwForm({ current: "", next: "", confirm: "" });
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10 relative">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Security & Privacy</h2>
          <p className="text-sm text-slate-500 mt-1">Protect your account and manage active devices.</p>
        </div>
      </motion.div>

      {/* ── Security Health Grid ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Password Health", status: "Strong", ok: true, Icon: KeyRound },
          { label: "Two-Factor Auth", status: twoFA ? "Enabled" : "Disabled", ok: twoFA, Icon: Smartphone },
          { label: "Email Address", status: "Verified", ok: true, Icon: ShieldCheck },
        ].map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 p-6 rounded-[2rem] border transition-colors ${
              item.ok 
                ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20" 
                : "bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20"
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              item.ok ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-amber-500 text-white shadow-amber-500/20"
            }`}>
              <item.Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                {item.label}
              </p>
              <p className={`text-lg font-black ${item.ok ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                {item.status}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Two Column Layout for Passwords & Sessions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Password Update */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Change Password</h3>
          </div>

          <div className="space-y-5">
            <Input
              label="Current Password"
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              error={pwErrors.current}
            />
            
            <div className="space-y-3">
              <Input
                label="New Password"
                type="password"
                value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                error={pwErrors.next}
              />
              {/* Animated Password Strength Meter */}
              {pwForm.next && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: i <= strength ? "100%" : "0%" }} 
                          className={`h-full ${strengthColors[strength]}`} 
                        />
                      </div>
                    ))}
                  </div>
                  <p className={`text-[11px] font-black uppercase tracking-widest ${strengthTextColors[strength]}`}>
                    {strengthLabels[strength]}
                  </p>
                </motion.div>
              )}
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              error={pwErrors.confirm}
            />

            <Button fullWidth loading={saving} onClick={savePw} className="py-3.5 mt-2">
              Update Password
            </Button>
          </div>
        </motion.div>

        {/* Right Column: 2FA and Sessions */}
        <div className="space-y-8">
          
          {/* 2FA Card */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm flex items-start sm:items-center justify-between gap-6 cursor-pointer group hover:border-blue-500/50 transition-colors" onClick={() => setTwoFA(!twoFA)}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl shrink-0">
                <MonitorSmartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Two-Factor Auth</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Add an extra layer of security requiring an OTP from your phone to login.</p>
              </div>
            </div>
            {/* Custom Animated Toggle */}
            <div className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ${twoFA ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <motion.span 
                animate={{ x: twoFA ? 22 : 4 }} 
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-5 w-5 rounded-full bg-white shadow-sm" 
              />
            </div>
          </motion.div>

          {/* Active Sessions */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
            <button onClick={() => setShowSessions(!showSessions)} className="flex items-center justify-between w-full focus:outline-none group">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Active Sessions</h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showSessions ? "rotate-180" : ""}`} />
            </button>
            
            <AnimatePresence>
              {showSessions && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: "auto", opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="overflow-hidden"
                >
                  <div className="pt-6 space-y-3">
                    {ACTIVE_SESSIONS.map((s) => (
                      <div key={s.id} className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-colors ${s.current ? "bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20" : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          {s.type === 'desktop' ? <Laptop className="w-4 h-4 text-slate-400" /> : <Smartphone className="w-4 h-4 text-slate-400" />}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{s.device}</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{s.location} • {s.time}</p>
                          </div>
                        </div>
                        {s.current ? (
                          <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-md text-[9px] font-black uppercase tracking-widest shrink-0">Current</span>
                        ) : (
                          <button className="p-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600 rounded-xl transition-colors shrink-0" title="Revoke Session">
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <motion.div variants={itemVariants} className="p-6 sm:p-8 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-[2.5rem] mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400">Danger Zone</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
            Deleting your account is permanent. All active rentals, saved vehicles, payment methods, and history will be permanently erased.
          </p>
        </div>
        <Button variant="danger" className="shrink-0 px-6 py-3 shadow-rose-500/20" onClick={() => setDeleteModal(true)}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
        </Button>
      </motion.div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6 shadow-inner border border-rose-100 dark:border-rose-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Delete Account?</h3>
              <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
                This action is <span className="font-bold text-rose-500">irreversible</span>. To confirm, please type <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">DELETE</strong> below.
              </p>
              
              <Input 
                placeholder='Type "DELETE"' 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="text-center font-black tracking-widest text-rose-500 placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
              />
              
              <div className="flex gap-3 mt-6">
                <Button variant="secondary" fullWidth onClick={() => { setDeleteModal(false); setDeleteConfirmText(""); }} className="py-3">
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  fullWidth 
                  className={`py-3 transition-all ${deleteConfirmText !== "DELETE" ? "opacity-50 cursor-not-allowed saturate-50" : "shadow-lg shadow-rose-500/30"}`}
                  disabled={deleteConfirmText !== "DELETE"}
                >
                  Confirm Deletion
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }} 
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-50 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-slate-800 dark:border-slate-200"
          >
            {toast.icon === "check" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}