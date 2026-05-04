import React from "react";
import { motion } from "framer-motion";

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

const RECOMMENDED_CARS = [
  { id: 1, name: "Mazda CX-5", type: "SUV", price: "KSh 6,000", rating: "4.9", trips: "124" },
  { id: 2, name: "Honda Fit", type: "Compact", price: "KSh 3,500", rating: "4.7", trips: "89" },
  { id: 3, name: "Subaru Forester", type: "SUV", price: "KSh 5,500", rating: "4.8", trips: "210" },
];

const RECENT_HISTORY = [
  { id: "BKG-6650", vehicle: "Nissan Note", dates: "Sep 12 - Sep 15", amount: "KSh 10,500", status: "Completed" },
  { id: "BKG-6122", vehicle: "Toyota Axio", dates: "Aug 02 - Aug 05", amount: "KSh 12,000", status: "Completed" },
  { id: "BKG-5901", vehicle: "Ford Ranger", dates: "Jul 10 - Jul 12", amount: "KSh 18,000", status: "Completed" },
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CustomerDashboard() {
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
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Welcome back, John!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ready for your next adventure?</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5">
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
          <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RECOMMENDED_CARS.map((car) => (
            <div key={car.id} className="rounded-2xl border bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              {/* Image Placeholder */}
              <div className="h-44 bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center relative overflow-hidden">
                <Car className="w-16 h-16 text-slate-300 dark:text-slate-700 transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4 px-2.5 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm">
                  {car.type}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{car.name}</h4>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-md text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {car.rating}
                  </div>
                </div>
                <div className="flex items-center gap-5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6">
                  <span className="flex items-center gap-1.5"><History className="w-4 h-4 text-slate-400 dark:text-slate-500" /> {car.trips} trips</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Insured</span>
                </div>
                <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">{car.price}</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400"> /day</span>
                  </div>
                  <button className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40">
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
          {RECENT_HISTORY.map((rental, idx) => (
            <Tr key={idx}>
              <Td label="Booking ID" className="font-bold text-slate-900 dark:text-slate-200">
                {rental.id}
              </Td>
              <Td label="Vehicle">
                <span className="font-semibold text-slate-800 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                  {rental.vehicle}
                </span>
              </Td>
              <Td label="Dates" className="font-medium text-slate-500 dark:text-slate-400">
                {rental.dates}
              </Td>
              <Td label="Amount" className="font-black text-slate-900 dark:text-slate-200">
                {rental.amount}
              </Td>
              <Td label="Status" className="sm:text-right">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {rental.status}
                </span>
              </Td>
            </Tr>
          ))}
        </Table>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30 text-center">
          <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            View Full History
          </button>
        </div>
      </motion.div>

    </motion.div>
  );
}