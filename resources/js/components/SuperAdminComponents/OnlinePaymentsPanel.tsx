import { useState } from "react";
import { AlertTriangle, CreditCard, Smartphone } from "lucide-react";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import { useApi } from "@/lib/useApi";
import { dateTime, ksh } from "@/lib/format";
import type { OnlinePayment, OnlinePaymentStatus, Paginated } from "@/types/models";

type Filter = "" | "attention" | "pending" | "succeeded" | "unsuccessful";
interface Listing extends Paginated<OnlinePayment> {
  summary: { attention: number; pending: number; succeeded_30d: number; unsuccessful_30d: number };
}

const STATUS_STYLE: Record<OnlinePaymentStatus, string> = {
  succeeded: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  expired: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

/** Every M-PESA prompt and card checkout, with anything that needs a person first. */
export default function OnlinePaymentsPanel() {
  const [filter, setFilter] = useState<Filter>("");
  const { data, loading, error, reload } = useApi<Listing>(`/api/admin/online-payments?per_page=25${filter ? `&status=${filter}` : ""}`);
  const rows = data?.data ?? [];
  const s = data?.summary;
  const filters: [Filter, string][] = [
    ["", "All"], ["attention", `Needs attention${s?.attention ? ` (${s.attention})` : ""}`], ["pending", "Waiting"], ["succeeded", "Paid"], ["unsuccessful", "Not completed"],
  ];

  return (
    <div className="rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Online payments</h3>
          <p className="text-xs text-slate-500">
            {s ? `${s.succeeded_30d} paid and ${s.unsuccessful_30d} not completed in the last 30 days${s.pending ? ` · ${s.pending} waiting` : ""}.` : "M-PESA prompts and card checkouts."}
          </p>
        </div>
        <div role="group" aria-label="Filter online payments" className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          {filters.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === id ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : id === "attention" && s?.attention ? "text-rose-600" : "text-slate-500"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {!!s?.attention && filter !== "attention" && (
        <button onClick={() => setFilter("attention")} className="w-full flex items-center gap-2 px-6 py-3 text-left text-sm font-bold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {s.attention} payment{s.attention === 1 ? "" : "s"} arrived but couldn't go on an invoice. Record or refund {s.attention === 1 ? "it" : "them"} by hand.
        </button>
      )}
      <LoadState loading={loading} error={error} onRetry={reload} empty={rows.length === 0 && "Nothing here."}>
        <Table heads={["Payment", "Booking", "Amount", "Status", "Detail"]}>
          {rows.map((p) => (
            <Tr key={p.id}>
              <Td label="Payment">
                <span className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {p.provider === "mpesa" ? <Smartphone className="w-4 h-4 text-emerald-500" /> : <CreditCard className="w-4 h-4 text-blue-500" />} {p.reference}
                </span>
                <span className="text-[10px] text-slate-400">{dateTime(p.created_at)}{p.simulated ? " · simulated" : ""}</span>
              </Td>
              <Td label="Booking">
                <span className="font-bold text-slate-900 dark:text-white block">{p.booking?.reference}</span>
                <span className="text-[10px] text-slate-400">{p.dealer}</span>
              </Td>
              <Td label="Amount" className="font-black text-slate-900 dark:text-white">{ksh(p.amount)}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.needs_attention ? STATUS_STYLE.failed : STATUS_STYLE[p.status]}`}>
                  {p.needs_attention ? "Needs attention" : p.status}
                </span>
              </Td>
              <Td label="Detail" className="text-xs text-slate-500 max-w-xs">
                {p.receipt && <span className="font-mono text-slate-700 dark:text-slate-300 block">{p.receipt}</span>}
                {p.message}{p.phone && <span className="block text-[10px] text-slate-400">{p.phone}</span>}
              </Td>
            </Tr>
          ))}
        </Table>
      </LoadState>
    </div>
  );
}
