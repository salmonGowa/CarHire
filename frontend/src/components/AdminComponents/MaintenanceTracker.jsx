import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Input from "../Input";
import Button from "../Button";
import { 
  Wrench, Calendar, AlertCircle, CheckCircle2, Clock, 
  History, Plus, MoreHorizontal, ChevronRight, 
  Settings2, ArrowUpRight, X, Filter
} from "lucide-react";
import { FaTools } from "react-icons/fa";

// --- Mock Data ---
const INITIAL_TASKS = [
  { id: "MT-102", vehicle: "Toyota Prado (KDK 123X)", service: "Oil & Filter Change", dueDate: "2023-10-30", priority: "High", status: "Scheduled" },
  { id: "MT-103", vehicle: "Mazda CX-5 (KDH 999Y)", service: "Brake Pad Replacement", dueDate: "2023-11-05", priority: "Medium", status: "Pending" },
];

const COMPLETED_TASKS = [
  { id: "MT-101", vehicle: "Honda Fit (KDG 444Z)", service: "General Inspection", dueDate: "2023-10-20", priority: "Low", status: "Completed", cost: "KSh 4,500" },
];

export default function MaintenanceTracker() {
  const [activeTasks, setActiveTasks] = useState(INITIAL_TASKS);
  const [history, setHistory] = useState(COMPLETED_TASKS);
  const [view, setView] = useState("active"); // 'active' | 'history'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Animation Variants
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

  const handleCompleteTask = (task) => {
    setActiveTasks(activeTasks.filter(t => t.id !== task.id));
    setHistory([{ ...task, status: "Completed", cost: "Pending" }, ...history]);
  };

  return (
    <motion.div 
      variants={{ show: { transition: { staggerChildren: 0.05 } } }} 
      initial="hidden" animate="show" 
      className="space-y-6 pb-10"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fleet Maintenance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep your fleet in peak condition with proactive tracking.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex items-center gap-2" onClick={() => setView(view === 'active' ? 'history' : 'active')}>
            {view === 'active' ? <History className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {view === 'active' ? 'View Logs' : 'View Active'}
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Schedule Service
          </Button>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="group p-5 rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-white dark:bg-[#0B1120] transition-all hover:shadow-lg hover:shadow-rose-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">Urgent</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical Repairs</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">2 Vehicles</h3>
        </div>

        <div className="group p-5 rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-[#0B1120] transition-all hover:shadow-lg hover:shadow-blue-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">Next 7 Days</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduled Tasks</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">5 Items</h3>
        </div>

        <div className="group p-5 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-[#0B1120] transition-all hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><ArrowUpRight className="w-3 h-3"/> 12%</div>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed (MTD)</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">14 Services</h3>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div variants={itemVariants} className="rounded-3xl border bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {view === 'active' ? 'Active Maintenance' : 'Service History'}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">
              {view === 'active' ? activeTasks.length : history.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Table heads={["Task Detail", "Service Type", "Schedule", "Priority", "Status", "Actions"]}>
          {(view === 'active' ? activeTasks : history).map((task, i) => (
            <Tr key={task.id}>
              <Td label="Task Detail">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${view === 'history' ? 'bg-slate-100 dark:bg-slate-800' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                    <FaTools className={`w-5 h-5 ${view === 'history' ? 'text-slate-400' : 'text-blue-500'}`} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{task.vehicle}</span>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">{task.id}</span>
                  </div>
                </div>
              </Td>
              <Td label="Service Type">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{task.service}</span>
                {task.cost && <span className="block text-[11px] text-emerald-500 font-bold">{task.cost}</span>}
              </Td>
              <Td label="Schedule">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{task.dueDate}</span>
                </div>
              </Td>
              <Td label="Priority">
                <div className={`flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider ${
                  task.priority === 'High' ? 'text-rose-500' : task.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    task.priority === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  {task.priority}
                </div>
              </Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                  task.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 
                  'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {task.status}
                </span>
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {view === 'active' && (
                    <button 
                      onClick={() => handleCompleteTask(task)}
                      className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:scale-105 transition-all"
                      title="Mark as Complete"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
        
        {/* Empty State */}
        {(view === 'active' ? activeTasks : history).length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No maintenance tasks found.</p>
          </div>
        )}
      </motion.div>

      {/* --- Simple Modal Placeholder --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Maintenance Entry</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <Input label="Vehicle Plate / Name" placeholder="e.g. KDK 123X" />
                <Input label="Service Required" placeholder="e.g. Engine Overhaul" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Due Date" type="date" />
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Priority</label>
                    <select className="w-full h-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-sm outline-none focus:border-blue-500 transition-all text-slate-200">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <Button fullWidth className="mt-4" onClick={() => setIsModalOpen(false)}>Save Task</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}