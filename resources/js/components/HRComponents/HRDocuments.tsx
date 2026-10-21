import { useRef, useState, type FormEvent } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import Input from "../Input";
import LoadState from "../LoadState";
import { UploadCloud, FolderOpen, Clock, AlertTriangle, Search, FileText, ShieldCheck, Eye, Download, X, Check, Trash2, Ban } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { longDate } from "@/lib/format";
import type { Employee, EmployeeDocument } from "@/types/hr";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const TYPES = ["National ID / Passport", "KRA PIN Certificate", "SHA / SHIF Card", "NSSF Card", "Driving Licence", "Employment Contract", "Academic Certificate", "Other"];
const selectClass = "w-full h-11 bg-white dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200";
const kb = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

interface DocList {
  data: EmployeeDocument[];
  summary: { total: number; pending: number; expiring: number };
}

export default function HRDocuments() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ employee_id: "", type: TYPES[0], expires_on: "" });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const { data, loading, error, reload } = useApi<DocList>("/api/hr/documents");
  const { data: staff } = useApi<{ data: Employee[] }>(isUploadOpen ? "/api/hr/employees" : null);
  const docs = (data?.data ?? []).filter(d =>
    d.employee.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase()),
  );
  const summary = data?.summary;

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrors({ file: "Choose a file to upload." });
      return;
    }
    setSaving(true);
    const body = new FormData();
    body.append("employee_id", form.employee_id);
    body.append("type", form.type);
    if (form.expires_on) body.append("expires_on", form.expires_on);
    body.append("file", file);
    try {
      await api("/api/hr/documents", { method: "POST", form: body });
      setIsUploadOpen(false);
      setFile(null);
      setForm({ employee_id: "", type: TYPES[0], expires_on: "" });
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const review = async (doc: EmployeeDocument, status: "verified" | "rejected") => {
    try {
      await api(`/api/hr/documents/${doc.id}`, { method: "PATCH", body: { status } });
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  const remove = async (doc: EmployeeDocument) => {
    if (!window.confirm(`Delete ${doc.type} for ${doc.employee.name}? The file is removed permanently.`)) return;
    try {
      await api(`/api/hr/documents/${doc.id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setMessage(errorMessage(err));
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Document Vault</h2>
          <p className="text-sm text-slate-500">Employee identity and compliance documents. Files are private and only HR can open them.</p>
        </div>
        <Button onClick={() => { setErrors({}); setIsUploadOpen(true); }} className="flex items-center gap-2 shadow-blue-500/20">
          <UploadCloud className="w-5 h-5" /> Upload Document
        </Button>
      </motion.div>

      {/* ── Compliance Metrics ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><FolderOpen className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Documents</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.total ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Verification</p><h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.pending ?? "—"}</h3></div>
        </div>
        <div className="p-6 rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
          <div><p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Expiring in 60 Days</p><h3 className="text-2xl font-black text-rose-600">{summary?.expiring ?? "—"}</h3></div>
        </div>
      </motion.div>

      {message && <p className="text-sm text-rose-600 dark:text-rose-400">{message}</p>}

      {/* ── Document Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search documents" placeholder="Search by employee or document type..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20" />
          </div>
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={docs.length === 0 && (search ? "No documents match." : "No documents uploaded yet.")}>
          <Table heads={["Document & Employee", "File", "Uploaded", "Status", "Actions"]}>
            {docs.map((doc) => (
              <Tr key={doc.id}>
                <Td label="Document">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><FileText className="w-5 h-5" /></div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{doc.type}</span>
                      <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase">{doc.employee.name}</span>
                    </div>
                  </div>
                </Td>
                <Td label="File">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-black text-slate-500 tracking-widest">{doc.format}</span>
                  <span className="block text-[10px] text-slate-400 mt-1">{kb(doc.size)}</span>
                </Td>
                <Td label="Uploaded" className="text-xs font-bold text-slate-500">
                  {longDate(doc.uploaded_at)}
                  {doc.expires_on && <span className={`block text-[10px] ${doc.expiring ? "text-rose-500" : "text-slate-400"}`}>Expires {longDate(doc.expires_on)}</span>}
                </Td>
                <Td label="Status">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    doc.status === "verified" ? (doc.expiring ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400")
                      : doc.status === "rejected" ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                  }`}>
                    {doc.status === "verified" ? (doc.expiring ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />) : doc.status === "rejected" ? <Ban className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {doc.status === "verified" && doc.expiring ? "Expiring" : doc.status}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {doc.status === "pending" && (
                      <>
                        <button onClick={() => review(doc, "verified")} aria-label={`Verify ${doc.type}`} title="Verify" className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl hover:scale-105 transition-all"><Check className="w-4 h-4" /></button>
                        <button onClick={() => review(doc, "rejected")} aria-label={`Reject ${doc.type}`} title="Reject" className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl hover:scale-105 transition-all"><X className="w-4 h-4" /></button>
                      </>
                    )}
                    <a href={`/api/hr/documents/${doc.id}/download?inline=1`} target="_blank" rel="noreferrer" aria-label={`View ${doc.type}`} title="View" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-500 transition-all"><Eye className="w-4 h-4" /></a>
                    <a href={`/api/hr/documents/${doc.id}/download`} aria-label={`Download ${doc.type}`} title="Download" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-500 transition-all"><Download className="w-4 h-4" /></a>
                    <button onClick={() => remove(doc)} aria-label={`Delete ${doc.type}`} title="Delete" className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      {/* ── Upload Modal ── */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUploadOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              role="dialog" aria-modal="true" aria-label="Upload document"
              className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30"><UploadCloud className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Upload Document</h3>
                </div>
                <button onClick={() => setIsUploadOpen(false)} aria-label="Close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <form onSubmit={upload} className="space-y-5">
                <div>
                  <label htmlFor="doc-emp" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Employee</label>
                  <select id="doc-emp" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} className={selectClass} required>
                    <option value="" disabled>Choose…</option>
                    {(staff?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="doc-type" className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide mb-1.5 block">Document Type</label>
                    <select id="doc-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={selectClass}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <Input label="Expires (optional)" type="date" value={form.expires_on} onChange={(e) => setForm({ ...form, expires_on: e.target.value })} error={errors.expires_on} />
                </div>
                <button type="button" onClick={() => fileInput.current?.click()}
                  className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 hover:border-blue-500 transition-colors cursor-pointer group">
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors mb-3" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{file ? file.name : "Click to choose a file"}</p>
                  <p className="text-xs text-slate-400 mt-1">{file ? kb(file.size) : "PDF, JPG or PNG, up to 5 MB"}</p>
                </button>
                <input ref={fileInput} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" aria-label="Document file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {errors.file && <p className="text-xs text-rose-500 -mt-3">{errors.file}</p>}
                {errors.form && <p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex gap-4">
                  <Button variant="secondary" fullWidth type="button" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                  <Button fullWidth type="submit" loading={saving}>Upload</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
