import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, Search, Filter, Plus, MoreHorizontal, 
  CheckCircle2, Clock, MapPin, User, Calendar, 
  Key, CreditCard, ArrowRight, ShieldCheck, X
} from "lucide-react";
import Button from "../Button";
import { Table, Tr, Td } from "../Card";

// --- Mock Data ---
const INITIAL_BOOKINGS = [
  { id: "BKG-7721", client: "John Doe", vehicle: "Toyota Prado", plate: "KDK 123X", pickup: "Oct 24", return: "Oct 27", amount: "KSh 45,000", status: "Active", payment: "M-PESA" },
  { id: "BKG-7722", client: "Sarah Wanjiku", vehicle: "Honda Fit", plate: "KDG 444Z", pickup: "Oct 25", return: "Oct 26", amount: "KSh 8,500", status: "Pending", payment: "Card" },
  { id: "BKG-7723", client: "Michael Ochieng", vehicle: "Mazda CX-5", plate: "KDH 999Y", pickup: "Oct 20", return: "Oct 22", amount: "KSh 18,000", status: "Completed", payment: "M-PESA" },
];

export default function DealerManageBooking() {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [view, setView] = useState("all"); // 'all' | 'pending' | 'active' | 'completed'
  const [search, setSearch] = useState("");

  const filteredBookings = bookings.filter(b => 
    (view === "all" || b.status.toLowerCase() === view) &&
    (b.client.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 pb-10"
    >
      {/* ── Header Area ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Booking Manager</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Oversee active rentals, verify payments, and handle vehicle returns.
          </p>
        </div>
        <Button className="flex items-center gap-2 px-6 py-3 shadow-blue-500/25">
          <Plus className="w-5 h-5" /> New Booking
        </Button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          {['all', 'pending', 'active', 'completed'].map((t) => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                view === t 
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search client or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 ring-blue-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* ── Main Bookings Table ── */}
      <div className="rounded-[2.5rem] border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table heads={["Booking Details", "Schedule", "Amount & Payment", "Status", "Actions"]}>
          {filteredBookings.map((b) => (
            <Tr key={b.id}>
              <Td label="Booking Details">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{b.client}</span>
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-tighter">
                      {b.id} • {b.vehicle}
                    </span>
                  </div>
                </div>
              </Td>

              <Td label="Schedule">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{b.pickup}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Return</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{b.return}</span>
                  </div>
                </div>
              </Td>

              <Td label="Financials">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-none">{b.amount}</span>
                  <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-500">
                    <CreditCard className="w-3 h-3" /> {b.payment} Verified
                  </div>
                </div>
              </Td>

              <Td label="Status">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  b.status === 'Active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' :
                  b.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' : 
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${
                    b.status === 'Active' ? 'bg-blue-500' : b.status === 'Pending' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  {b.status}
                </span>
              </Td>

              <Td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-blue-600">
                    <Key className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>

        {filteredBookings.length === 0 && (
          <div className="py-20 text-center">
            <ClipboardList className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No bookings found in this category.</p>
          </div>
        )}
      </div>

      {/* ── Operational Insights (Footer) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Pickup</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">In 2 Hours</h4>
          </div>
        </div>
        
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">KRA Ready</h4>
          </div>
        </div>
        
        <div className="p-6 rounded-3xl border border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-500/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">Total Active Revenue</p>
            <h4 className="text-xl font-black">KSh 124,500</h4>
          </div>
          <ArrowRight className="w-6 h-6 text-blue-200" />
        </div>
      </div>
    </motion.div>
  );
}