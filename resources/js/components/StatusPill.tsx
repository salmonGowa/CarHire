import type { Booking } from "@/types/models";
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_STYLE } from "@/lib/format";

export default function BookingStatusPill({ booking }: { booking: Pick<Booking, "status" | "is_overdue"> }) {
  const key = booking.is_overdue ? "overdue" : booking.status;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${BOOKING_STATUS_STYLE[key]}`}>
      {booking.is_overdue ? "Overdue" : BOOKING_STATUS_LABEL[booking.status]}
    </span>
  );
}
