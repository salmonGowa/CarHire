import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import { 
  FolderOpen, UploadCloud, Search, ShieldCheck, 
  FileText, Download, AlertTriangle, CheckCircle2, 
  Clock, X, Eye
} from "lucide-react";

// --- Mock Data ---
const DOCUMENTS = [
  { id: "DOC-001", emp: "Amina Hassan", type: "KRA PIN Certificate", uploaded: "Oct 10, 2023", status: "Verified", format: "PDF" },
  { id: "DOC-002", emp: "David Kipkorir", type: "NHIF Card Copy", uploaded: "Oct 15, 2023", status: "Verified", format: "JPG" },
  { id: "DOC-003", emp: "James Otieno", type: "NTSA Driver License", uploaded: "Oct 24, 2023", status: "Pending", format: "PDF" },
  { id: "DOC-004", emp: "Sarah Wanjiku", type: "Employment Contract", uploaded: "Jan 12, 2023", status: "Expiring", format: "PDF" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function HRDocuments() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredDocs = DOCUMENTS.filter(d => 
    d.emp.toLowerCase().includes(search.toLowerCase()) || 
    d.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Document Vault</h2>
          <p className="text-sm text-slate-500">Securely manage employee compliance and identity documents.</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="flex items-center gap-2 shadow-blue-500/20">
          <UploadCloud className="w-5 h-5" /> Upload Document
        </Button>
      </motion.div>

      {/* ── Compliance Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><FolderOpen className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Documents</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">124</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Verification</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">8</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Expiring Soon</p><h3 className="text-2xl font-black text-rose-600">3</h3></div>
        </div>
      </motion.div>

      {/* ── Document Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee or document type..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" 
              />
           </div>
        </div>
        
        <Table heads={["Document & Employee", "File Type", "Upload Date", "Status", "Actions"]}>
          {filteredDocs.map((doc) => (
            <Tr key={doc.id}>
              <Td label="Document">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><FileText className="w-5 h-5" /></div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{doc.type}</span>
                    <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase">{doc.emp}</span>
                  </div>
                </div>
              </Td>
              <Td label="Format">
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-black text-slate-500 tracking-widest">{doc.format}</span>
              </Td>
              <Td label="Upload Date" className="text-xs font-bold text-slate-500">{doc.uploaded}</Td>
              <Td label="Status">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 
                  doc.status === 'Expiring' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {doc.status === 'Verified' ? <ShieldCheck className="w-3 h-3" /> : doc.status === 'Expiring' ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {doc.status}
                </span>
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-500 transition-all"><Eye className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-500 transition-all"><Download className="w-4 h-4" /></button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>

      {/* ── Secure Upload Modal ── */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUploadOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30"><UploadCloud className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Upload Document</h3>
                </div>
                <button onClick={() => setIsUploadOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form className="space-y-5">
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Employee</label>
                   <select className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200">
                     <option>Amina Hassan</option>
                     <option>David Kipkorir</option>
                     <option>James Otieno</option>
                   </select>
                </div>
                
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Document Type</label>
                   <select className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200">
                     <option>KRA PIN Certificate</option>
                     <option>National ID / Passport</option>
                     <option>NHIF Card</option>
                     <option>NSSF Card</option>
                     <option>NTSA Driver License</option>
                     <option>Employment Contract</option>
                   </select>
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 hover:border-blue-500 transition-colors group cursor-pointer bg-slate-50/50 dark:bg-slate-900/50">
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to browse or drag file here</p>
                  <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG (Max 5MB)</p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex gap-4">
                   <Button variant="secondary" fullWidth type="button" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                   <Button fullWidth type="button" onClick={() => setIsUploadOpen(false)}>Secure Upload</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}