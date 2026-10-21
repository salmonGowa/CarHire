import { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import { ShieldAlert, Search, Server, User, Download, AlertTriangle, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { dateTime } from "@/lib/format";
import type { AuditEntry } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const SEVERITY_STYLE: Record<AuditEntry["severity"], string> = {
  critical: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20",
  warning: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20",
  info: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};
const SEVERITY_ICON = { critical: AlertTriangle, warning: ShieldAlert, info: Activity };

interface LogPage {
  data: AuditEntry[];
  meta: { total: number; current_page: number; last_page: number };
}

export default function SuperAdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebounced(search.trim());

  const filters = new URLSearchParams({ ...(term && { search: term }), ...(severity && { severity }) });
  const { data, loading, error, reload } = useApi<LogPage>(`/api/admin/audit-logs?${filters}&page=${page}`);
  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Audit Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Sign-ins, account changes, bookings, payments and payouts, recorded as they happen. Entries can't be edited.</p>
        </div>
        <a href={`/api/admin/audit-logs/export?${filters}`}
          className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search logs" placeholder="Search by IP, actor, action or description..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white" />
          </div>
          <div className="flex gap-1" role="group" aria-label="Severity">
            {["", "info", "warning", "critical"].map((s) => (
              <button key={s} onClick={() => { setSeverity(s); setPage(1); }} aria-pressed={severity === s}
                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize ${severity === s ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={logs.length === 0 && "No log entries match."}>
          <Table heads={["Timestamp & ID", "Actor & IP", "Event", "Severity"]}>
            {logs.map((log) => {
              const Icon = SEVERITY_ICON[log.severity];
              return (
                <Tr key={log.id}>
                  <Td>
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 block whitespace-nowrap">{dateTime(log.at)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.reference}</span>
                  </Td>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" /> {log.actor}</span>
                      <span className="font-mono text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5"><Server className="w-3 h-3 text-slate-400" /> {log.ip_address ?? "Internal"}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block">{log.description}</span>
                    <span className="font-mono text-[10px] text-slate-400">{log.action}</span>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${SEVERITY_STYLE[log.severity]}`}>
                      <Icon className="w-3 h-3" /> {log.severity}
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </LoadState>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
            <span>{meta.total} entries · page {meta.current_page} of {meta.last_page}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} aria-label="Next page" className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
