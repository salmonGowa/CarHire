import { type Variants, motion } from "framer-motion";
import SupportDesk from "../SupportDesk";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SuperAdminSupport() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Global Support Center</h2>
        <p className="text-sm text-slate-500 mt-1">Tickets from customers and dealerships. Urgent and roadside requests are listed first.</p>
      </motion.div>
      <motion.div variants={itemVariants}>
        <SupportDesk admin />
      </motion.div>
    </motion.div>
  );
}
