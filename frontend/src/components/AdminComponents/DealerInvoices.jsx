import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import { 
  Receipt, Search, FileText, Download, Eye, 
  CheckCircle2, Clock, ShieldCheck, Plus, 
  Printer, Send, BadgeCheck, X, Building2
} from "lucide-react";

const INVOICES = [
  { id: "INV-2023-881", client: "Alex Mutua", date: "Oct 24, 2023", subtotal: 38793, tax: 6207, total: 45000, status: "Paid", kra: "TIMS Verified", timsSig: "DFP-881-A2B4" },
  { id: "INV-2023-882", client: "Luxe Corporate", date: "Oct 22, 2023", subtotal: 103448, tax: 16552, total: 120000, status: "Sent", kra: "Pending Sync", timsSig: "Pending" },
];

export default function DealerInvoices() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tax & Invoicing</h2>
          <p className="text-sm text-slate-500">Automated ETR generation synced with KRA iTax portal.</p>
        </div>
        <Button className="flex items-center gap-2 shadow-blue-500/20"><Plus className="w-5 h-5" /> Generate Invoice</Button>
      </div>

      {/* ── KRA Compliance Notice ── */}
      <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> KRA TIMS Active
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-500/80 font-semibold mt-1">
              Your dealer PIN (P051XXXXXXX) is securely transmitting real-time VAT data.
            </p>
          </div>
        </div>
        <Button variant="secondary" className="bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
          View Sync Logs
        </Button>
      </div>

      {/* ── Invoices Table ── */}
      <div className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search by INV number or client..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 transition-all" />
           </div>
        </div>
        
        <Table heads={["Invoice Details", "Date", "Subtotal", "VAT (16%)", "Grand Total", "KRA Sync", "Actions"]}>
          {INVOICES.map((inv) => (
            <Tr key={inv.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><Receipt className="w-5 h-5" /></div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{inv.client}</span>
                    <span className="text-[10px] font-mono font-black text-blue-500 tracking-wider uppercase">{inv.id}</span>
                  </div>
                </div>
              </Td>
              <Td className="text-slate-500 font-bold text-xs">{inv.date}</Td>
              <Td className="text-slate-600 dark:text-slate-400 font-semibold">KSh {inv.subtotal.toLocaleString()}</Td>
              <Td className="text-rose-500 font-bold">KSh {inv.tax.toLocaleString()}</Td>
              <Td className="font-black text-slate-900 dark:text-white text-base">KSh {inv.total.toLocaleString()}</Td>
              <Td>
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                  inv.kra === 'TIMS Verified' ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {inv.kra === 'TIMS Verified' ? <BadgeCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {inv.kra}
                </div>
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => setSelectedInvoice(inv)} className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-600 transition-all group relative">
                    <Eye className="w-4 h-4" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap transition-all pointer-events-none">View ETR</span>
                  </button>
                  <button className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><Download className="w-4 h-4" /></button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </div>

      {/* ── Invoice Preview Modal (ETR Format) ── */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInvoice(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
               {/* Modal Header Actions */}
               <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                 <div className="flex gap-2">
                   <Button variant="secondary" className="px-3 py-1.5 text-xs"><Printer className="w-3.5 h-3.5 mr-1" /> Print</Button>
                   <Button className="px-3 py-1.5 text-xs"><Send className="w-3.5 h-3.5 mr-1" /> Email Client</Button>
                 </div>
                 <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
               </div>

               {/* ETR Paper Simulation */}
               <div className="p-8 overflow-y-auto bg-[#fafafa] dark:bg-slate-950 text-slate-800 dark:text-slate-300 font-mono text-xs custom-scrollbar rounded-b-3xl">
                  <div className="text-center border-b-2 border-dashed border-slate-300 dark:border-slate-700 pb-6 mb-6">
                     <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-900 dark:text-white" />
                     <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-widest">DriveFleet Motors</h2>
                     <p>Waiyaki Way, Nairobi, KE</p>
                     <p>PIN: P051XXXXXXXA</p>
                     <p className="mt-4 font-bold text-sm">TAX INVOICE / RECEIPT</p>
                  </div>

                  <div className="flex justify-between mb-6">
                    <div>
                      <p>Date: {selectedInvoice.date}</p>
                      <p>Time: 14:32:01</p>
                    </div>
                    <div className="text-right">
                      <p>INV NO: {selectedInvoice.id}</p>
                      <p>Cashier: ADMIN</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold border-b border-slate-300 dark:border-slate-700 pb-1 mb-2">Billed To:</p>
                    <p>{selectedInvoice.client}</p>
                  </div>

                  <table className="w-full mb-6">
                    <thead className="border-y border-slate-300 dark:border-slate-700 text-left">
                      <tr><th className="py-2">Description</th><th className="py-2 text-right">Amt (KSh)</th></tr>
                    </thead>
                    <tbody>
                      <tr><td className="py-2">Vehicle Hire (3 Days)</td><td className="py-2 text-right">{selectedInvoice.subtotal.toLocaleString()}</td></tr>
                    </tbody>
                  </table>

                  <div className="space-y-1 text-right mb-6">
                    <p>SUBTOTAL: {selectedInvoice.subtotal.toLocaleString()}</p>
                    <p>VAT (16%): {selectedInvoice.tax.toLocaleString()}</p>
                    <p className="text-lg font-black border-t-2 border-dashed border-slate-300 dark:border-slate-700 pt-2 mt-2 text-slate-900 dark:text-white">TOTAL: {selectedInvoice.total.toLocaleString()}</p>
                  </div>

                  <div className="text-center border-t border-slate-300 dark:border-slate-700 pt-6">
                    <p className="font-bold mb-2">*** KRA TIMS DETAILS ***</p>
                    <p className="text-[10px]">CUIN: DFP-881-A2B4-XXXX</p>
                    <p className="text-[10px]">TIMS SIGNATURE: {selectedInvoice.timsSig}</p>
                    <div className="mt-4 inline-block p-2 bg-white rounded-xl">
                      {/* Fake QR Code Pattern */}
                      <div className="w-24 h-24 bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover" style={{ filter: "grayscale(1)" }} />
                    </div>
                    <p className="mt-4 font-bold uppercase">Thank you for your business!</p>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}