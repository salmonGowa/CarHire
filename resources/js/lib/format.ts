import type { BookingStatus, InvoiceStatus, PaymentMethod, ReceivedMethod, VehicleStatus } from "@/types/models";

export const ksh = (amount: number) => `KSh ${amount.toLocaleString("en-KE")}`;

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric" });

export const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  available: "Available",
  rented: "Rented",
  maintenance: "Maintenance",
};

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BOOKING_STATUS_STYLE: Record<BookingStatus | "overdue", string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  confirmed: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
};

/** The verb shown on the button that moves a booking into each status. */
export const TRANSITION_ACTION: Record<BookingStatus, string> = {
  pending: "Reopen",
  confirmed: "Confirm",
  active: "Hand over keys",
  completed: "Mark returned",
  cancelled: "Cancel",
};

export const PAYMENT_LABEL: Record<PaymentMethod | ReceivedMethod, string> = {
  mpesa: "M-PESA",
  card: "Card",
  cash: "Cash",
  bank: "Bank transfer",
  pay_later: "Pay Later",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  unpaid: "Unpaid",
  partial: "Part paid",
  paid: "Paid",
  void: "Void",
};

export const INVOICE_STATUS_STYLE: Record<InvoiceStatus, string> = {
  unpaid: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  partial: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  void: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

/** Compact money for charts and KPI tiles: KSh 1.2M, KSh 45K. */
export const kshShort = (amount: number) => {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}KSh ${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 10_000) return `${sign}KSh ${Math.round(abs / 1000)}K`;
  return `${sign}KSh ${abs.toLocaleString("en-KE")}`;
};

/** Percentage change from previous to current, or null when there's no baseline. */
export const percentChange = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;

/** Mirrors Booking::quote() on the server, for live previews only; the server's figure is authoritative. */
export function quote(dailyRate: number, pickupAt: string, returnAt: string) {
  const ms = new Date(returnAt).getTime() - new Date(pickupAt).getTime();
  if (!dailyRate || !(ms > 0)) return null;
  const days = Math.max(1, Math.ceil(ms / 86_400_000));
  const subtotal = dailyRate * days;
  const vat = Math.round(subtotal * 0.16);
  return { days, subtotal, vat, total: subtotal + vat };
}

/** Today (or the given date) as YYYY-MM-DD in the user's local time zone. */
export const localIsoDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
