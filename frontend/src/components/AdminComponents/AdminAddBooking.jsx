import React, { useState } from "react";
import { motion } from "framer-motion";
import Input from "../Input"; // Adjust path as necessary
import Button from "../Button"; // Adjust path as necessary
import { 
  User, Car, Calendar, CreditCard, Search, MapPin, 
  CheckCircle2, ShieldCheck, FileText, Phone, Mail, FileDigit
} from "lucide-react";

// --- Mock Data ---
const AVAILABLE_VEHICLES = [
  { id: "V-001", name: "Toyota Land Cruiser Prado", plate: "KDK 123X", rate: 15000, type: "SUV" },
  { id: "V-002", name: "Mazda CX-5", plate: "KDH 999Y", rate: 8500, type: "SUV" },
  { id: "V-003", name: "Honda Fit", plate: "KDG 444Z", rate: 3500, type: "Compact" },
];

const LOCATIONS = ["Nairobi CBD", "Mombasa Airport", "Kisumu Branch", "Eldoret Branch"];

// --- Animations ---
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminAddBooking() {
  const [formData, setFormData] = useState({
    searchQuery: "",
    firstName: "", lastName: "", phone: "", email: "", idNumber: "",
    vehicleId: "", pickupDate: "", pickupTime: "10:00", returnDate: "", returnTime: "10:00",
    location: "Nairobi CBD", paymentMethod: "M-PESA"
  });

  // Derived state for the live summary
  const selectedVehicle = AVAILABLE_VEHICLES.find(v => v.id === formData.vehicleId);
  const baseRate = selectedVehicle ? selectedVehicle.rate : 0;
  
  // Basic calculation simulation (Assuming 1 day if dates aren't fully parsed for this mockup)
  const estimatedDays = formData.pickupDate && formData.returnDate ? 3 : 0; // Hardcoded to 3 for visual preview
  const subtotal = baseRate * (estimatedDays || 1);
  const vat = subtotal * 0.16;
  const grandTotal = subtotal + vat;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Booking Submitted:", formData);
    // API logic goes here
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

            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search existing client by phone or email..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all text-slate-700 dark:text-slate-200"
                value={formData.searchQuery}
                onChange={(e) => setFormData({...formData, searchQuery: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" placeholder="e.g. John" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
              <Input label="Last Name" placeholder="e.g. Doe" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
              <div className="relative">
                <Phone className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
                <Input label="Phone Number" placeholder="07XX XXX XXX" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div className="relative">
                <Mail className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
                <Input label="Email Address" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="sm:col-span-2 relative">
                <FileDigit className="absolute right-3 top-[38px] w-4 h-4 text-slate-400 pointer-events-none" />
                <Input label="National ID / Passport Number" placeholder="Required for verification" value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} required />
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
                  <Input label="Date" type="date" value={formData.pickupDate} onChange={(e) => setFormData({...formData, pickupDate: e.target.value})} required />
                  <Input label="Time" type="time" value={formData.pickupTime} onChange={(e) => setFormData({...formData, pickupTime: e.target.value})} required />
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                  <p className="text-xs font-black uppercase text-rose-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Return Schedule</p>
                  <Input label="Date" type="date" value={formData.returnDate} onChange={(e) => setFormData({...formData, returnDate: e.target.value})} required />
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
                  {AVAILABLE_VEHICLES.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.plate}) - KSh {v.rate.toLocaleString()}/day</option>
                  ))}
                </select>
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
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedVehicle.name}</p>
                    <p className="text-xs font-mono text-blue-500 font-bold mt-0.5">{selectedVehicle.plate}</p>
                    <p className="text-xs text-slate-500 mt-2">{estimatedDays > 0 ? `${estimatedDays} Days` : "Dates pending"} @ KSh {selectedVehicle.rate.toLocaleString()}/day</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic">No vehicle selected</p>
                )}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">KSh {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">VAT (16%)</span>
                  <span className="font-bold text-slate-900 dark:text-white">KSh {vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-black text-slate-900 dark:text-white">Grand Total</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">KSh {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['M-PESA', 'Card', 'Cash', 'Pay Later'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: method})}
                      className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                        formData.paymentMethod === method 
                          ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400" 
                          : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <Button fullWidth type="submit" className="py-4 text-sm shadow-xl shadow-blue-500/20">
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