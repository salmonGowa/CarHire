import type { Booking } from "@/types/models";

export interface TripPhase {
  label: string;
  tone: "blue" | "emerald" | "amber" | "rose";
  countdownLabel: string;
  target: number;
  overdue: boolean;
}

/** Where a booking stands right now, and what the countdown is counting towards. */
export function tripPhase(b: Booking, now: number): TripPhase {
  const pickup = new Date(b.pickup_at).getTime();
  const ret = new Date(b.return_at).getTime();
  if (b.status === "active") {
    return ret < now
      ? { label: "Return overdue", tone: "rose", countdownLabel: "Overdue by", target: ret, overdue: true }
      : { label: "Trip in progress", tone: "emerald", countdownLabel: "Time left", target: ret, overdue: false };
  }
  if (b.status === "pending") return { label: "Waiting for dealer to confirm", tone: "amber", countdownLabel: "Pickup in", target: pickup, overdue: false };
  return pickup < now
    ? { label: "Ready for pickup", tone: "blue", countdownLabel: "Pickup was due", target: pickup, overdue: true }
    : { label: "Confirmed", tone: "blue", countdownLabel: "Pickup in", target: pickup, overdue: false };
}

/** A Google Maps search link for a place (no API key needed). */
export const mapsLink = (...parts: (string | null | undefined)[]) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.filter(Boolean).join(", "))}`;
