import { type Variants, motion } from "framer-motion";
import SupportDesk from "../SupportDesk";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DealerSupport() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Help & Support</h2>
        <p className="text-sm text-slate-500 mt-1">Ask DriveFleet about payouts, billing, your account or anything else. Everyone at your dealership can see these tickets.</p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <SupportDesk bookingsPath="/api/bookings" />
      </motion.div>
    </motion.div>
  );
}
