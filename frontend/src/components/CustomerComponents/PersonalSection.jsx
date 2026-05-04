import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Input from "../Input";
import Button from "../Button";
import { 
  User, Camera, Award, CheckCircle2, Car, Calendar, 
  Star, Mail, Phone, MapPin, Home, Globe, FileText, 
  CreditCard, Check, X
} from "lucide-react";

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function PersonalSection({ user }) {
  const [form, setForm] = useState({
    firstName: "James",
    lastName:  "Mwangi",
    email:     user?.email || "james.mwangi@example.com",
    phone:     "+254 712 345 678",
    altPhone:  "",
    city:      "Nairobi",
    country:   "Kenya",
    address:   "123 Kimathi Street, CBD",
    language:  "English",
    idType:    "National ID",
    idNumber:  "29847502",
    bio:       "Frequent business traveler based in Nairobi. I love exploring Kenya in well-maintained vehicles.",
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.email.trim())     e.email     = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())     e.phone     = "Required";
    
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 900)); // Simulate API Call
    setSaving(false);
    
    setToast("Profile updated successfully");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8 pb-10 relative">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Personal Information</h2>
          <p className="text-sm text-slate-500 mt-1">Update your personal details, contact info, and public profile.</p>
        </div>
      </motion.div>

      {/* ── Avatar & Quick Stats ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div variants={itemVariants} className="xl:col-span-2 p-6 sm:p-8 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group cursor-pointer shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-xl overflow-hidden relative">
              <span className="relative z-10 group-hover:opacity-0 transition-opacity duration-300">
                {(form.firstName[0] || "J").toUpperCase()}
              </span>
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 shadow-md hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{form.firstName} {form.lastName}</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Member since January 2023</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Identity
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-xl">
                <Award className="w-3.5 h-3.5" /> Gold Tier
              </span>
            </div>
            <p className="text-xs text-slate-400">Allowed formats: JPG, PNG (Max 2MB)</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-rows-3 gap-3">
          {[
            { label: "Total Rentals", value: "23 Trips", icon: Car, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
            { label: "Days on Road", value: "67 Days", icon: Calendar, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
            { label: "Avg Rating", value: "4.8 / 5.0", icon: Star, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Forms Area ── */}
      <motion.div variants={itemVariants} className="space-y-6">
        
        {/* Basic Info */}
        <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm space-y-6">
           <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
             <User className="w-5 h-5 text-blue-500" /> Basic Details
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Input label="First Name" value={form.firstName} onChange={set("firstName")} error={errors.firstName} placeholder="John" />
             <Input label="Last Name" value={form.lastName} onChange={set("lastName")} error={errors.lastName} placeholder="Doe" />
             <Input label="Email Address" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="you@example.com" />
             <Input label="Phone Number" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="+254 7XX XXX XXX" />
           </div>
        </div>

        {/* Location Info */}
        <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm space-y-6">
           <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
             <MapPin className="w-5 h-5 text-emerald-500" /> Location & Address
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Input label="City" value={form.city} onChange={set("city")} placeholder="e.g. Nairobi" />
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Country</label>
                <select
                  value={form.country}
                  onChange={set("country")}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                >
                  {["Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia"].map(c => <option key={c}>{c}</option>)}
                </select>
             </div>
             <div className="sm:col-span-2">
                <Input label="Physical Address" value={form.address} onChange={set("address")} placeholder="123 Main St, CBD" />
             </div>
           </div>
        </div>

        {/* Verification & Bio */}
        <div className="p-6 sm:p-8 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm space-y-6">
           <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
             <CreditCard className="w-5 h-5 text-violet-500" /> Identification & Bio
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID Type</label>
                <select
                  value={form.idType}
                  onChange={set("idType")}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                >
                  {["National ID", "Passport", "Driver's License"].map(t => <option key={t}>{t}</option>)}
                </select>
             </div>
             <Input label="ID Number" value={form.idNumber} onChange={set("idNumber")} placeholder="Enter ID number" />
             
             <div className="sm:col-span-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Public Bio</label>
                  <span className="text-[10px] font-bold text-slate-400">{form.bio.length}/200</span>
                </div>
                <textarea
                  value={form.bio}
                  onChange={set("bio")}
                  maxLength={200}
                  rows={4}
                  placeholder="Tell dealers a bit about yourself…"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none custom-scrollbar"
                />
             </div>
           </div>
        </div>

      </motion.div>

      {/* ── Actions ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
        <Button variant="secondary" className="px-8 py-3.5" onClick={() => setErrors({})}>
          <X className="w-4 h-4 mr-2" /> Discard Changes
        </Button>
        <Button loading={saving} onClick={handleSave} className="px-8 py-3.5 shadow-blue-500/20">
          {!saving && <Check className="w-4 h-4 mr-2" />} Save Profile
        </Button>
      </motion.div>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }} 
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-50 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm border border-slate-800 dark:border-slate-200"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}