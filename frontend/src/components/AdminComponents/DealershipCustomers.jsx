import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import { 
  Users, Search, Filter, MoreHorizontal, UserPlus, 
  ShieldCheck, ShieldAlert, Star, Mail, Phone, 
  History, CreditCard, X, ChevronRight, Download, FileText
} from "lucide-react";

// --- Mock Data ---
const CUSTOMERS = [
  { 
    id: "CUS-8801", 
    name: "John Doe", 
    email: "john@example.com", 
    phone: "0712 345 678", 
    totalTrips: 12, 
    totalSpent: "KSh 185,000", 
    status: "Trusted",
    lastRental: "Toyota Prado",
    docs: "Verified"
  },
  { 
    id: "CUS-8802", 
    name: "Jane Smith", 
    email: "jane@smith.me", 
    phone: "0722 987 654", 
    totalTrips: 4, 
    totalSpent: "KSh 42,000", 
    status: "Verified",
    lastRental: "Mazda CX-5",
    docs: "Verified"
  },
  { 
    id: "CUS-8803", 
    name: "Michael Ochieng", 
    email: "mike.o@work.co.ke", 
    phone: "0733 111 222", 
    totalTrips: 1, 
    totalSpent: "KSh 8,500", 
    status: "New",
    lastRental: "Honda Fit",
    docs: "Pending"
  },
];

export default function DealershipCustomers() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");

  const filteredCustomers = CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative h-full space-y-6 pb-10">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Customer Hub</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage relationships and track customer loyalty.</p>
        </div>
        <Button className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Add Customer</Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><Users className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Clients</p><h3 className="text-xl font-black text-slate-900 dark:text-white">1,240</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trusted Score</p><h3 className="text-xl font-black text-slate-900 dark:text-white">85%</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Star className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Repeat Renters</p><h3 className="text-xl font-black text-slate-900 dark:text-white">412</h3></div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          placeholder="Search by name, ID or phone..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 ring-blue-500/20"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <Table heads={["Customer", "Contact", "Usage", "Status", "Actions"]}>
          {filteredCustomers.map((c) => (
            <Tr key={c.id} onClick={() => setSelectedCustomer(c)}>
              <Td label="Customer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{c.id}</span>
                  </div>
                </div>
              </Td>
              <Td label="Contact">
                <div className="flex flex-col text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</span>
                  <span className="flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {c.phone}</span>
                </div>
              </Td>
              <Td label="Usage">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{c.totalSpent}</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase">{c.totalTrips} Trips Total</span>
                </div>
              </Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  c.status === 'Trusted' ? 'bg-blue-100 text-blue-700' : 
                  c.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {c.status}
                </span>
              </Td>
              <Td className="text-right">
                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><MoreHorizontal className="w-5 h-5" /></button>
              </Td>
            </Tr>
          ))}
        </Table>
      </div>

      {/* ── Customer Detail Drawer (Side Panel) ── */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="fixed inset-0 z-[110] bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md z-[120] bg-white dark:bg-[#0B1120] border-l border-slate-200 dark:border-slate-800 shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
                <div className="flex gap-2">
                   <Button variant="secondary" className="p-2.5"><Download className="w-5 h-5" /></Button>
                   <Button variant="secondary" className="p-2.5 text-rose-500"><ShieldAlert className="w-5 h-5" /></Button>
                </div>
              </div>

              <div className="text-center mb-8">
                 <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20">
                    {selectedCustomer.name.charAt(0)}
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{selectedCustomer.name}</h3>
                 <p className="text-sm font-bold text-slate-400 mt-2">Verified Renter Since 2023</p>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60">
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Quick Insights</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">Trust Score</p>
                         <p className="text-lg font-black text-emerald-500">9.8/10</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-500 uppercase">Documents</p>
                         <p className="text-lg font-black text-blue-500">{selectedCustomer.docs}</p>
                      </div>
                   </div>
                </div>

                <div>
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                     <History className="w-4 h-4" /> Activity Ledger
                   </h4>
                   <div className="space-y-3">
                      {[1, 2].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg"><CreditCard className="w-4 h-4" /></div>
                              <div>
                                 <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">BKG-772{i}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase">Oct 24, 2023</p>
                              </div>
                           </div>
                           <span className="text-sm font-black text-slate-900 dark:text-white">KSh 15,000</span>
                        </div>
                      ))}
                   </div>
                </div>

                <Button fullWidth className="py-4 rounded-2xl text-base font-black uppercase tracking-widest">
                   Initiate New Booking
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}