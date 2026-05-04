import React from "react";
import { motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import { 
  FileSignature, FileText, Download, Eye, 
  CheckCircle2, AlertCircle, Clock, Plus, Search 
} from "lucide-react";

const CONTRACTS = [
  { id: "AGR-9921", client: "John Doe", vehicle: "Toyota Prado", duration: "3 Days", type: "Self-Drive", status: "Signed" },
  { id: "AGR-9920", client: "Jane Smith", vehicle: "Mazda CX-5", duration: "7 Days", type: "Chauffeur", status: "Pending Signature" },
  { id: "AGR-9919", client: "Michael O.", vehicle: "Nissan Note", duration: "1 Day", type: "Self-Drive", status: "Expired" },
];

const itemVariants = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

export default function DealerContracts() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hire Agreements</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage digital contracts and legal documentation.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4" /> Draft New Contract
        </button>
      </motion.div>

      {/* Analytics Summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Signed Today</p><h3 className="text-xl font-black text-slate-900 dark:text-white">12 Agreements</h3></div>
        </div>
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Waiting for Client</p><h3 className="text-xl font-black text-slate-900 dark:text-white">5 Pending</h3></div>
        </div>
        <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center"><FileText className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Templates</p><h3 className="text-xl font-black text-slate-900 dark:text-white">4 Available</h3></div>
        </div>
      </motion.div>

      {/* Contract Table */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table heads={["Contract ID", "Client Name", "Vehicle / Plan", "Duration", "Status", "Actions"]}>
          {CONTRACTS.map((contract) => (
            <Tr key={contract.id}>
              <Td label="Contract ID">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400"><FileSignature className="w-4 h-4" /></div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{contract.id}</span>
                </div>
              </Td>
              <Td label="Client" className="font-bold text-slate-900 dark:text-white">{contract.client}</Td>
              <Td label="Vehicle">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">{contract.vehicle}</span>
                <span className="text-[10px] text-blue-500 font-bold uppercase">{contract.type}</span>
              </Td>
              <Td label="Duration" className="text-slate-500 dark:text-slate-400 font-medium">{contract.duration}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  contract.status === 'Signed' ? 'bg-emerald-100 text-emerald-700' :
                  contract.status === 'Expired' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {contract.status}
                </span>
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><Eye className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><Download className="w-4 h-4" /></button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>
    </motion.div>
  );
}