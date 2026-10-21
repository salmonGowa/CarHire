import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import BookingStatusPill from "../components/StatusPill";
import { useApi } from "@/lib/useApi";
import { ksh, shortDate } from "@/lib/format";
import type { Booking, Paginated, Vehicle } from "@/types/models";
import { type Variants, motion } from "framer-motion";

import { Car, Calendar, MapPin, Clock, Star, ShieldCheck, ArrowRight,History,Navigation,Key,LifeBuoy,PlusCircle,AlertTriangle,Gift
} from "lucide-react";
import { Table, Td, Tr } from "../components/Card";
import ActiveTripDashboard from "../components/CustomerComponents/ActiveTripDashboard";

// --- Mock Data ---
const ACTIVE_TRIP = {
  vehicle: "Toyota Land Cruiser Prado",
  plate: "KDK 123X",
  pickup: "Today, 10:00 AM",
  return: "Oct 28, 10:00 AM",
  location: "Nairobi CBD Branch",
  status: "Picking up soon",
  bookingId: "BKG-7721A"
};

const LOYALTY = {
  tier: "Gold Member",
  points: 2450,
  nextTier: 3000,
  perks: "10% off next SUV rental"
};

const QUICK_ACTIONS = [
  { icon: PlusCircle, label: "Extend Trip", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  { icon: LifeBuoy, label: "Roadside Assist", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { icon: AlertTriangle, label: "Report Issue", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
  { icon: Gift, label: "Redeem Points", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
];





// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: catalog } = useApi<Paginated<Vehicle>>("/api/catalog/vehicles?per_page=3");
  const { data: history } = useApi<Paginated<Booking>>("/api/bookings?per_page=5");
  const RECOMMENDED_CARS = catalog?.data ?? [];
  const RECENT_HISTORY = history?.data ?? [];
  const firstName = user?.name.split(" ")[0] ?? "there";
  const progressPercentage = (LOYALTY.points / LOYALTY.nextTier) * 100;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-8 pb-10"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Welcome back, {firstName}!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ready for your next adventure?</p>
        </div>
        <button onClick={() => navigate("/customer-browse")} className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5">
          <Car className="w-4 h-4" /> Book a Vehicle
        </button>
      </motion.div>

      {/* Quick Actions Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {QUICK_ACTIONS.map((action, idx) => (
          <button key={idx} className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B1120] hover:border-slate-300 dark:hover:border-slate-700 transition-all group shadow-sm hover:shadow-md`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${action.bg} ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{action.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Top Row: Active Trip & Loyalty Stats */}
      <ActiveTripDashboard />
      

      {/* Middle Row: Recommended Cars */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recommended for you</h3>
          <button onClick={() => navigate("/customer-browse")} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RECOMMENDED_CARS.map((car) => (
            <div key={car.id} className="rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              {/* Image Placeholder */}
              <div className="h-44 bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center relative overflow-hidden">
                {car.image_url
                  ? <img src={car.image_url} alt={car.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  : <Car className="w-16 h-16 text-slate-300 dark:text-slate-700 transition-transform duration-700 group-hover:scale-110" />}
                <div className="absolute top-4 left-4 px-2.5 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm">
                  {car.type}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{car.model}</h4>
                  {car.rating != null && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-md text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {car.rating}
                  </div>
                  )}
                </div>
                <div className="flex items-center gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {car.dealer?.name}</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Insured</span>
                </div>
                <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">{ksh(car.daily_rate)}</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400"> /day</span>
                  </div>
                  <button onClick={() => navigate("/customer-browse")} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom Row: Recent History */}
      <motion.div variants={itemVariants} className="rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Rentals</h3>
          <button className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <History className="w-4 h-4" />
          </button>
        </div>
        
        {/* Custom Responsive Table Implementation */}
        <Table heads={["Booking ID", "Vehicle", "Dates", "Amount", "Status"]}>
          {RECENT_HISTORY.map((rental) => (
            <Tr key={rental.id} onClick={() => navigate("/customer-rentals")}>
              <Td label="Booking ID" className="font-bold text-slate-900 dark:text-slate-200">
                {rental.reference}
              </Td>
              <Td label="Vehicle">
                <span className="font-semibold text-slate-800 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                  {rental.vehicle?.model}
                </span>
              </Td>
              <Td label="Dates" className="font-medium text-slate-500 dark:text-slate-400">
                {shortDate(rental.pickup_at)} - {shortDate(rental.return_at)}
              </Td>
              <Td label="Amount" className="font-black text-slate-900 dark:text-slate-200">
                {ksh(rental.total)}
              </Td>
              <Td label="Status" className="sm:text-right">
                <BookingStatusPill booking={rental} />
              </Td>
            </Tr>
          ))}
        </Table>
        {RECENT_HISTORY.length === 0 && <p className="p-8 text-center text-sm text-slate-500">{history ? "No rentals yet. Your trips will show up here." : "Loading…"}</p>}

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 text-center">
          <button onClick={() => navigate("/customer-rentals")} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            View Full History
          </button>
        </div>
      </motion.div>

    </motion.div>
  );
}