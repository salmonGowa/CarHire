import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import { 
  Star, Search, Filter, MessageSquare, AlertCircle, 
  CheckCircle2, MoreHorizontal, CornerDownRight, X 
} from "lucide-react";

// --- Mock Data ---
const REVIEWS = [
  { id: "REV-091", customer: "Sarah Wanjiku", rating: 5, date: "Oct 24, 2023", car: "Toyota Prado", text: "Exceptional service! The car was spotless and the handover was seamless. Will definitely rent from here again.", status: "Pending Reply" },
  { id: "REV-090", customer: "Michael Ochieng", rating: 4, date: "Oct 21, 2023", car: "Mazda CX-5", text: "Great car, ran perfectly. Only giving 4 stars because the pickup took about 15 minutes longer than expected.", status: "Replied" },
  { id: "REV-089", customer: "John Doe", rating: 5, date: "Oct 18, 2023", car: "Honda Fit", text: "Highly recommend. Very fuel efficient and the dealer was extremely professional.", status: "Pending Reply" },
];

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DealerReviews() {
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");

  const handleReplySubmit = (e) => {
    e.preventDefault();
    // Logic to submit reply goes here
    setSelectedReview(null);
    setReplyText("");
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Customer Reviews</h2>
          <p className="text-sm text-slate-500">Manage your reputation and respond to client feedback.</p>
        </div>
      </motion.div>

      {/* ── Analytics Summary ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-amber-100 text-xs font-black uppercase tracking-widest">Average Rating</p>
            <Star className="w-6 h-6 text-amber-200 fill-amber-200" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black leading-none">4.8</h3>
            <span className="text-amber-100 font-bold">/ 5.0</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Reviews</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">342</h3>
          </div>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">5-Star Ratio</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">92%</h3>
          </div>
        </div>
      </motion.div>

      {/* ── Reviews Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search reviews..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20" />
           </div>
           <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400"><Filter className="w-5 h-5" /></button>
        </div>
        
        <Table heads={["Customer & Rating", "Review", "Vehicle", "Status", "Actions"]}>
          {REVIEWS.map((rev) => (
            <Tr key={rev.id}>
              <Td label="Customer">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white">{rev.customer}</span>
                  <div className="flex items-center gap-0.5 mt-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                    ))}
                  </div>
                </div>
              </Td>
              <Td label="Review" className="max-w-xs">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2">{rev.text}</p>
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">{rev.date}</span>
              </Td>
              <Td label="Vehicle" className="font-bold text-blue-500 text-xs">{rev.car}</Td>
              <Td label="Status">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  rev.status === 'Replied' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {rev.status}
                </span>
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {rev.status === 'Pending Reply' && (
                    <button onClick={() => setSelectedReview(rev)} className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl hover:scale-105 transition-all title='Reply'">
                      <CornerDownRight className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><AlertCircle className="w-4 h-4" /></button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      </motion.div>

      {/* ── Reply Modal ── */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedReview(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Respond to Feedback</h3>
                <button onClick={() => setSelectedReview(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm dark:text-white">{selectedReview.customer}</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(selectedReview.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{selectedReview.text}"</p>
              </div>

              <form onSubmit={handleReplySubmit}>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Your Public Reply</label>
                <textarea 
                  rows="4" 
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a professional response..." 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 mb-6 resize-none"
                  required
                />
                <Button fullWidth type="submit" className="gap-2">Post Reply <CornerDownRight className="w-4 h-4" /></Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}