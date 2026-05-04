import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  UserCheck, UserPlus, Search, MoreHorizontal, CheckCircle2, 
  ShieldCheck, Star, Smartphone, MapPin, X, FileText, 
  History, Car, User, Navigation, CreditCard, ChevronLeft
} from "lucide-react";

//mock data
const DRIVER_DATABASE = [
  { 
    id: "DRV-101", 
    name: "Alex Mutua", 
    phone: "0712 345 678", 
    license: "Class B/C1", 
    rating: "4.9", 
    status: "On Trip", 
    currentCar: "KDK 123X (Toyota Prado)",
    currentCustomer: "John Doe",
    joined: "Oct 2022",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    licenseImg: "https://images.unsplash.com/photo-1512418490979-92798ccc13b0?auto=format&fit=crop&q=80&w=500",
    history: [
      { car: "KDH 999Y", client: "Jane Smith", dest: "Nairobi - Mombasa", date: "Oct 12, 2023" },
      { car: "KDG 444Z", client: "Michael O.", dest: "Local (Nairobi)", date: "Oct 05, 2023" },
    ]
  },
   { 
    id: "DRV-102", 
    name: "Sarah Johnson", 
    phone: "0798 765 432", 
    license: "Class A", 
    rating: "4.8", 
    status: "Available", 
    currentCar: "KDK 123X (Toyota Prado)",
    currentCustomer: "John Doe",
    joined: "Oct 2022",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    licenseImg: "https://images.unsplash.com/photo-1512418490979-92798ccc13b0?auto=format&fit=crop&q=80&w=500",
    history: [
      { car: "KDH 999Y", client: "Jane Smith", dest: "Nairobi - Mombasa", date: "Oct 12, 2023" },
      { car: "KDG 444Z", client: "Michael O.", dest: "Local (Nairobi)", date: "Oct 05, 2023" },
    ]
  },
];

export default function DealershipDrivers() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [search, setSearch] = useState("");

  const filteredDrivers = DRIVER_DATABASE.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative h-full">
      <AnimatePresence mode="wait">
        {!selectedDriver ? (
          /* ── Main List View ── */
          <motion.div 
            key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-6 pb-10"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Driver Network</h2>
                <p className="text-sm text-slate-500">Manage professional drivers and track fleet assignments.</p>
              </div>
              <Button className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Onboard Driver</Button>
            </div>

            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search drivers..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none transition-all focus:ring-2 ring-blue-500/20"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <Table heads={["Driver", "License", "Current Duty", "Rating", "Actions"]}>
                {filteredDrivers.map((d) => (
                  <Tr key={d.id} onClick={() => setSelectedDriver(d)}>
                    <Td label="Driver">
                      <div className="flex items-center gap-3">
                        <img src={d.img} className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800" alt={d.name} />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{d.name}</span>
                          <span className="text-[11px] font-medium text-slate-500">{d.id}</span>
                        </div>
                      </div>
                    </Td>
                    <Td label="License"><span className="text-xs font-black text-blue-500">{d.license}</span></Td>
                    <Td label="Current Duty">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{d.currentCar !== "None" ? d.currentCar : "Standby"}</span>
                    </Td>
                    <Td label="Rating">
                       <div className="flex items-center gap-1 text-amber-500 font-black"><Star className="w-3.5 h-3.5 fill-current" /> {d.rating}</div>
                    </Td>
                    <Td className="text-right">
                      <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </motion.div>
        ) : (
          /* ── Full Profile Drill-Down View ── */
          <motion.div 
            key="detail" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="space-y-8 pb-10"
          >
            {/* Header / Back */}
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedDriver(null)} className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Driver Profile: {selectedDriver.name}</h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column: Essential Info */}
              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-10" />
                  <img src={selectedDriver.img} className="w-32 h-32 rounded-3xl object-cover mx-auto mb-4 border-[6px] border-white dark:border-slate-900 shadow-xl relative z-10" alt={selectedDriver.name} />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none">{selectedDriver.name}</h3>
                  <p className="text-sm font-bold text-slate-400 mt-2">{selectedDriver.id} • Member since {selectedDriver.joined}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                     <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{selectedDriver.phone}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">License</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{selectedDriver.license}</p>
                     </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Current Assignment</h4>
                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/[0.03] border border-blue-100 dark:border-blue-500/20">
                      <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"><Car className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{selectedDriver.currentCar}</p>
                        <p className="text-[11px] font-bold text-blue-500">Client: {selectedDriver.currentCustomer}</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* Right Column: History & Docs */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Destination History Table */}
                <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Previous Trips & History</h4>
                    <History className="w-5 h-5 text-slate-300" />
                  </div>
                  <Table heads={["Vehicle", "Client", "Route / Destination", "Date"]}>
                    {selectedDriver.history.map((h, i) => (
                      <Tr key={i}>
                        <Td className="font-bold text-blue-500">{h.car}</Td>
                        <Td className="font-bold text-slate-700 dark:text-slate-300">{h.client}</Td>
                        <Td className="text-slate-500">{h.dest}</Td>
                        <Td className="text-right text-[11px] font-black uppercase text-slate-400">{h.date}</Td>
                      </Tr>
                    ))}
                  </Table>
                </div>

                {/* Digital License Display */}
                <div className="p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Document Vault: DL Copy</h4>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase"><ShieldCheck className="w-3.5 h-3.5" /> Verified by NTSA</span>
                  </div>
                  <div className="relative group rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-video flex items-center justify-center">
                    <img src={selectedDriver.licenseImg} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" alt="License" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button variant="secondary" className="bg-white"><FileText className="w-4 h-4 mr-2" /> View Original</Button>
                      <Button className="bg-blue-600"><Smartphone className="w-4 h-4 mr-2" /> Request Update</Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}