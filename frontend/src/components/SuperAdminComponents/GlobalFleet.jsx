import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import { Car, CheckCircle2, Wrench, MoreHorizontal } from "lucide-react";

const FLEET = [
  { plate: "KDK 123X", model: "Toyota Prado", dealer: "Premier Auto", location: "Nairobi CBD", status: "Rented" },
  { plate: "KDH 999Y", model: "Mazda CX-5", dealer: "Swift Car Hire", location: "Mombasa", status: "Available" },
  { plate: "KDG 444Z", model: "Honda Fit", dealer: "City Movers", location: "Kisumu", status: "Maintenance" },
];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function GlobalFleet() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Global Fleet Tracking</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor all 1,204 vehicles across the platform.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><Car className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Rented Out</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">840</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Available</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">312</h3></div>
        </div>
        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center"><Wrench className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">Maintenance</p><h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">52</h3></div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <Table heads={["Plate", "Vehicle Model", "Owner (Dealer)", "Location", "Status", "Actions"]}>
          {FLEET.map((car, i) => (
            <Tr key={i}>
              <Td label="Plate" className="font-bold text-slate-900 dark:text-slate-200">{car.plate}</Td>
              <Td label="Model" className="font-semibold text-slate-800 dark:text-slate-300">{car.model}</Td>
              <Td label="Dealer" className="text-slate-500 dark:text-slate-400 font-medium">{car.dealer}</Td>
              <Td label="Location" className="text-slate-500 dark:text-slate-400 font-medium">{car.location}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  car.status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                  car.status === 'Rented' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {car.status}
                </span>
              </Td>
              <Td className="text-right sm:text-center">
                <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"><MoreHorizontal className="w-5 h-5 ml-auto sm:mx-auto" /></button>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}