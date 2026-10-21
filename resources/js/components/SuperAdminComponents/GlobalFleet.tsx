import { useState } from "react";
import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import { Car, CheckCircle2, Search, Wrench } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { VEHICLE_STATUS_LABEL, ksh } from "@/lib/format";
import type { Paginated, Stats, Vehicle, VehicleStatus } from "@/types/models";

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

const STATUS_STYLE: Record<VehicleStatus, string> = {
  available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  rented: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  maintenance: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

export default function GlobalFleet() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | VehicleStatus>("");
  const term = useDebounced(search.trim());
  const query = new URLSearchParams({ per_page: "100", ...(term && { search: term }), ...(status && { status }) });
  const { data, loading, error, reload } = useApi<Paginated<Vehicle>>(`/api/vehicles?${query}`);
  const { data: stats } = useApi<Stats>("/api/stats");
  const fleet = data?.data ?? [];
  const v = stats?.vehicles;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Global Fleet Tracking</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {v ? `Monitor all ${v.total.toLocaleString()} vehicles across the platform.` : "Monitor every vehicle across the platform."}
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Rented Out", value: v?.rented, icon: Car, tone: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { label: "Available", value: v?.available, icon: CheckCircle2, tone: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "Maintenance", value: v?.maintenance, icon: Wrench, tone: "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" },
        ].map((card) => (
          <div key={card.label} className="p-6 rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.tone}`}><card.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value?.toLocaleString() ?? "—"}</h3>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search model or plate..."
            aria-label="Search vehicles"
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | VehicleStatus)}
          aria-label="Filter by status"
          className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="">All statuses</option>
          {(Object.keys(VEHICLE_STATUS_LABEL) as VehicleStatus[]).map((s) => <option key={s} value={s}>{VEHICLE_STATUS_LABEL[s]}</option>)}
        </select>
      </motion.div>

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload} empty={fleet.length === 0 && "No vehicles match."}>
          <Table heads={["Plate", "Vehicle Model", "Owner (Dealer)", "Location", "Rate", "Status"]}>
            {fleet.map((car) => (
              <Tr key={car.id}>
                <Td label="Plate" className="font-bold text-slate-900 dark:text-slate-200">{car.plate}</Td>
                <Td label="Model" className="font-semibold text-slate-800 dark:text-slate-300">{car.model}</Td>
                <Td label="Dealer" className="text-slate-500 dark:text-slate-400 font-medium">{car.dealer?.name}</Td>
                <Td label="Location" className="text-slate-500 dark:text-slate-400 font-medium">{car.location ?? car.dealer?.city ?? "—"}</Td>
                <Td label="Rate" className="text-slate-700 dark:text-slate-300 font-semibold">{ksh(car.daily_rate)}/day</Td>
                <Td label="Status">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_STYLE[car.status]}`}>
                    {VEHICLE_STATUS_LABEL[car.status]}
                  </span>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
        {data && data.meta.total > fleet.length && (
          <p className="px-6 py-3 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">Showing {fleet.length} of {data.meta.total}. Narrow the search to find others.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
