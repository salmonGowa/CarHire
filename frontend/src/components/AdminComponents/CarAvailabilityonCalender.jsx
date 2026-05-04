import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Car, Wrench, Clock, CheckCircle2, X, Plus,
  User, Key, MapPin, MoreHorizontal 
} from "lucide-react";
import Button from "../Button";
import Input from "../Input";

// --- Initial Mock Data ---
const INITIAL_EVENTS = [
  { id: 1, type: 'rental', title: "Return: Toyota Prado", plate: "KDK 123X", time: "10:00 AM", day: 24, status: "In Progress", user: "John Doe" },
  { id: 2, type: 'service', title: "Ready: Mazda CX-5", plate: "KDH 999Y", time: "02:00 PM", day: 24, status: "In Service" },
  { id: 3, type: 'rental', title: "Pickup: Honda Fit", plate: "KDG 444Z", time: "09:00 AM", day: 26, status: "Confirmed", user: "Sarah W." },
];

export default function CarAvailabilityCalendar() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [viewDate, setViewDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State for new events
  const [formData, setFormData] = useState({
    title: "", plate: "", type: "rental", time: "09:00 AM", day: selectedDay, status: "Scheduled"
  });

  // --- Calendar Logic ---
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    
    return { days, blanks, monthName: viewDate.toLocaleString('default', { month: 'long' }), year };
  }, [viewDate]);

  const getEventsForDay = (day) => events.filter(e => e.day === day);

  // --- Handlers ---
  const handleAddEvent = (e) => {
    e.preventDefault();
    const newEvent = { ...formData, id: Date.now(), day: parseInt(formData.day) };
    setEvents([...events, newEvent]);
    setIsModalOpen(false);
    setFormData({ title: "", plate: "", type: "rental", time: "09:00 AM", day: selectedDay, status: "Scheduled" });
  };

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + offset)));
  };

  return (
    <div className="flex flex-col xl:flex-row h-[calc(100vh-120px)] gap-6 overflow-hidden pb-4">
      
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
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{calendarData.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setViewDate(new Date())} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Today</button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="grid grid-cols-7 border-l border-t border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-r border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20">
                {d}
              </div>
            ))}
            
            {calendarData.blanks.map(i => <div key={`b-${i}`} className="border-r border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-transparent" />)}
            
            {calendarData.days.map(date => {
              const dayEvents = getEventsForDay(date);
              const isSelected = selectedDay === date;
              return (
                <div 
                  key={date}
                  onClick={() => { setSelectedDay(date); setFormData(prev => ({...prev, day: date})); }}
                  className={`min-h-[110px] p-2 border-r border-b border-slate-100 dark:border-slate-800/60 transition-all cursor-pointer relative group ${
                    isSelected ? "bg-blue-50/40 dark:bg-blue-500/[0.04]" : "hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                  }`}
                >
                  <span className={`text-sm font-black transition-colors ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-600"}`}>
                    {date < 10 ? `0${date}` : date}
                  </span>
                  
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className={`px-2 py-1 rounded-lg text-[9px] font-black truncate border ${
                          e.type === 'service' 
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100 dark:border-rose-500/20" 
                            : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-500/20"
                        }`}>
                        {e.plate}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[9px] font-bold text-slate-400 pl-1">+{dayEvents.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Right Side: Agenda & Add Event ── */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full xl:w-96 flex flex-col gap-6">
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Day Agenda</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{calendarData.monthName} {selectedDay}</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {getEventsForDay(selectedDay).map((e) => (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={e.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-white/[0.02] group">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${e.type === 'service' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {e.type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{e.time}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{e.title}</h4>
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-blue-500">{e.plate}</div>
                  <span className="text-[10px] font-bold text-slate-500">{e.status}</span>
                </div>
              </motion.div>
            ))}

            {getEventsForDay(selectedDay).length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-40">
                <Car className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm font-bold text-slate-400">Empty Agenda</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Add Event Modal ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Schedule Operation</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button type="button" onClick={() => setFormData({...formData, type: 'rental'})} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.type === 'rental' ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>Rental</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'service'})} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.type === 'service' ? 'border-rose-600 bg-rose-50 dark:bg-rose-500/10 text-rose-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>Service</button>
                </div>
                <Input label="Operation Title" placeholder="e.g. Return: Prado" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                <Input label="Vehicle Plate" placeholder="KDK 123X" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} required />
                <div className="grid grid-cols-2 gap-4">
                   <Input label="Day of Month" type="number" min="1" max="31" value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} required />
                   <Input label="Time" type="text" placeholder="10:00 AM" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
                </div>
                <Button fullWidth type="submit" className="mt-4">Confirm Schedule</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}