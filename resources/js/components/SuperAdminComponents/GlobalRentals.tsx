import { type Variants, motion } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import LoadState from "../LoadState";
import BookingStatusPill from "../StatusPill";
import { ClipboardList, Key, XCircle } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { ksh } from "@/lib/format";
import type { Booking, Paginated, Stats } from "@/types/models";

const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

export default function GlobalRentals() {
  const { data, loading, error, reload } = useApi<Paginated<Booking>>("/api/bookings?per_page=50");
  const { data: stats } = useApi<Stats>("/api/stats");
  const rentals = data?.data ?? [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Global Rentals</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cross-dealer booking and reservation tracking.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Active Bookings", value: stats?.bookings.active, icon: Key, tone: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { label: "Completed (Today)", value: stats?.bookings.completed_today, icon: ClipboardList, tone: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "Cancelled (Today)", value: stats?.bookings.cancelled_today, icon: XCircle, tone: "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" },
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

      <motion.div variants={itemVariants} className="rounded-2xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <LoadState loading={loading} error={error} onRetry={reload} empty={rentals.length === 0 && "No bookings yet."}>
          <Table heads={["Booking ID", "Customer", "Dealer", "Vehicle", "Amount", "Status"]}>
            {rentals.map((rental) => (
              <Tr key={rental.id}>
                <Td label="ID" className="font-bold text-slate-900 dark:text-slate-200">{rental.reference}</Td>
                <Td label="Customer" className="font-semibold text-slate-800 dark:text-slate-300">{rental.customer.name}</Td>
                <Td label="Dealer" className="text-slate-500 dark:text-slate-400 font-medium">{rental.dealer?.name}</Td>
                <Td label="Vehicle" className="text-slate-500 dark:text-slate-400 font-medium">{rental.vehicle?.model}</Td>
                <Td label="Amount" className="text-slate-900 dark:text-slate-100 font-black">{ksh(rental.total)}</Td>
                <Td label="Status"><BookingStatusPill booking={rental} /></Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>
    </motion.div>
  );
}
