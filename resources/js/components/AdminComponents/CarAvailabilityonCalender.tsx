import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Car, Plus,
} from "lucide-react";
import { useApi } from "@/lib/useApi";
import { BOOKING_STATUS_LABEL } from "@/lib/format";
import type { Booking, Paginated } from "@/types/models";

interface CalendarEvent {
  id: string;
  kind: "pickup" | "return";
  at: Date;
  booking: Booking;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function CarAvailabilityCalendar() {
  const navigate = useNavigate();
  const [viewDate, setViewDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  // Every booking that touches this month, so pickups and returns can be placed on the grid.
  const { data, loading, error } = useApi<Paginated<Booking>>(
    `/api/bookings?per_page=200&from=${isoDay(monthStart)}&to=${isoDay(monthEnd)}`,
  );

  // --- Calendar Logic ---
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return { days, blanks, monthName: viewDate.toLocaleString("default", { month: "long" }), year };
  }, [viewDate, year, month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const booking of data?.data ?? []) {
      if (booking.status === "cancelled") continue;
      for (const kind of ["pickup", "return"] as const) {
        const at = new Date(kind === "pickup" ? booking.pickup_at : booking.return_at);
        const key = dayKey(at);
        map.set(key, [...(map.get(key) ?? []), { id: `${booking.id}-${kind}`, kind, at, booking }]);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.at.getTime() - b.at.getTime());
    return map;
  }, [data]);

  const getEventsForDate = (d: Date) => eventsByDay.get(dayKey(d)) ?? [];

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const goToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now);
  };

  const today = dayKey(new Date());
  const agenda = getEventsForDate(selectedDay);

  return (
    <div className="flex flex-col xl:flex-row xl:h-[calc(100vh-120px)] gap-6 xl:overflow-hidden pb-4">

      {/* ── Left Side: Main Calendar ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden"
      >
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/30 dark:bg-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-500/10">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{calendarData.monthName}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {calendarData.year}{loading ? " · loading…" : error ? " · couldn't load bookings" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button onClick={() => changeMonth(-1)} aria-label="Previous month" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={goToday} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Today</button>
            <button onClick={() => changeMonth(1)} aria-label="Next month" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="flex gap-4 mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500" /> Pickup</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Return</span>
          </div>
          <div className="grid grid-cols-7 border-l border-t border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-r border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
                {d}
              </div>
            ))}

            {calendarData.blanks.map(i => <div key={`b-${i}`} className="border-r border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-transparent" />)}

            {calendarData.days.map(date => {
              const cellDate = new Date(year, month, date);
              const dayEvents = getEventsForDate(cellDate);
              const isSelected = dayKey(selectedDay) === dayKey(cellDate);
              const isToday = dayKey(cellDate) === today;
              return (
                <button
                  type="button"
                  key={date}
                  onClick={() => setSelectedDay(cellDate)}
                  aria-pressed={isSelected}
                  aria-label={`${calendarData.monthName} ${date}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
                  className={`min-h-[88px] sm:min-h-[110px] p-2 border-r border-b border-slate-100 dark:border-slate-800/60 transition-all cursor-pointer relative group text-left align-top ${
                    isSelected ? "bg-blue-50/40 dark:bg-blue-500/[0.04]" : "hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                  }`}
                >
                  <span className={`text-sm font-black transition-colors ${isSelected || isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600"}`}>
                    {date < 10 ? `0${date}` : date}
                  </span>

                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className={`px-2 py-1 rounded-lg text-[9px] font-black truncate border ${
                          e.kind === "return"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                            : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-500/20"
                        }`}>
                        {e.booking.vehicle?.plate}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[9px] font-bold text-slate-400 pl-1">+{dayEvents.length - 2} more</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Right Side: Agenda ── */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full xl:w-96 flex flex-col gap-6">
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Day Agenda</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {selectedDay.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <button onClick={() => navigate("/admin-add-booking")} aria-label="New booking" title="New booking" className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {agenda.map((e) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={e.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-white/[0.02] group">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter text-white ${e.kind === "return" ? "bg-emerald-500" : "bg-blue-500"}`}>
                    {e.kind}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{e.at.toLocaleTimeString("default", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {e.kind === "pickup" ? "Pickup" : "Return"}: {e.booking.vehicle?.model}
                </h4>
                <p className="text-xs text-slate-500 mb-3">{e.booking.customer.name} · {e.booking.pickup_location}</p>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-blue-500">{e.booking.vehicle?.plate}</div>
                  <span className={`text-[10px] font-bold ${e.booking.is_overdue ? "text-rose-500" : "text-slate-500"}`}>
                    {e.booking.is_overdue ? "Overdue" : BOOKING_STATUS_LABEL[e.booking.status]} · {e.booking.reference}
                  </span>
                </div>
              </motion.div>
            ))}

            {agenda.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                <Car className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">No pickups or returns</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
