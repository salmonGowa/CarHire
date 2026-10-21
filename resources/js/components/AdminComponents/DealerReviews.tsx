import { useState, type FormEvent } from "react";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Table, Tr, Td } from "../Card";
import Button from "../Button";
import LoadState from "../LoadState";
import { Star, MessageSquare, CheckCircle2, CornerDownRight, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useApi } from "@/lib/useApi";
import { useDebounced } from "@/lib/useDebounced";
import { longDate } from "@/lib/format";
import type { Review } from "@/types/models";

const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface ReviewList {
  data: Review[];
  summary: { average: number | null; total: number; five_star_share: number | null; awaiting_reply: number };
}

export default function DealerReviews() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unanswered">("all");
  const term = useDebounced(search.trim());

  const query = new URLSearchParams({ ...(term && { search: term }), ...(filter === "unanswered" && { filter }) });
  const { data, setData, loading, error, reload } = useApi<ReviewList>(`/api/reviews?${query}`);
  const reviews = data?.data ?? [];
  const summary = data?.summary;

  const openReply = (rev: Review) => {
    setSelectedReview(rev);
    setReplyText(rev.reply ?? "");
    setReplyError("");
  };

  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;
    setSaving(true);
    try {
      const { data: saved } = await api<{ data: { reply: string; replied_at: string } }>(`/api/bookings/${selectedReview.booking_id}/reply`, { method: "PUT", body: { reply: replyText } });
      setData((d) => d && {
        summary: { ...d.summary, awaiting_reply: Math.max(0, d.summary.awaiting_reply - (selectedReview.reply ? 0 : 1)) },
        data: d.data.map((r) => (r.booking_id === selectedReview.booking_id ? { ...r, reply: saved.reply, replied_at: saved.replied_at } : r)),
      });
      setSelectedReview(null);
      setReplyText("");
    } catch (err) {
      setReplyError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="space-y-6 pb-10">
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Customer Reviews</h2>
          <p className="text-sm text-slate-500">Ratings left after completed trips. Your replies are shown to the customer.</p>
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
            <h3 className="text-5xl font-black leading-none">{summary?.average ?? "—"}</h3>
            <span className="text-amber-100 font-bold">/ 5.0</span>
          </div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Reviews</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.total ?? "—"}</h3>
            {summary && summary.awaiting_reply > 0 && <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{summary.awaiting_reply} awaiting reply</p>}
          </div>
        </div>
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">5-Star Share</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{summary?.five_star_share != null ? `${summary.five_star_share}%` : "—"}</h3>
          </div>
        </div>
      </motion.div>

      {/* ── Reviews Table ── */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search reviews" placeholder="Search by customer or text..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 ring-blue-500/20" />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {(["all", "unanswered"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filter === f ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500"}`}>
                {f === "all" ? "All" : "Awaiting reply"}
              </button>
            ))}
          </div>
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} empty={reviews.length === 0 && (filter === "unanswered" ? "You've replied to every written review." : "No reviews yet.")}>
          <Table heads={["Customer & Rating", "Review", "Vehicle", "Status", "Actions"]}>
            {reviews.map((rev) => (
              <Tr key={rev.booking_id}>
                <Td label="Customer">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">{rev.customer_name}</span>
                    <div className="flex items-center gap-0.5 mt-1 text-amber-500" aria-label={`${rev.rating} out of 5`}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < rev.rating ? "fill-current" : "text-slate-300 dark:text-slate-700"}`} />
                      ))}
                    </div>
                  </div>
                </Td>
                <Td label="Review" className="max-w-xs">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2">{rev.review ?? <span className="italic text-slate-400">Rating only</span>}</p>
                  {rev.reply && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 line-clamp-1 flex items-center gap-1"><CornerDownRight className="w-3 h-3 shrink-0" /> {rev.reply}</p>}
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block">{longDate(rev.rated_at)} · {rev.booking_reference}</span>
                </Td>
                <Td label="Vehicle" className="font-bold text-blue-500 text-xs">{rev.vehicle}</Td>
                <Td label="Status">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    rev.reply ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : rev.review ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {rev.reply ? "Replied" : rev.review ? "Pending Reply" : "Rated"}
                  </span>
                </Td>
                <Td className="text-right">
                  <button onClick={() => openReply(rev)} title={rev.reply ? "Edit reply" : "Reply"} aria-label={rev.reply ? "Edit reply" : "Reply"}
                    className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl hover:scale-105 transition-all">
                    <CornerDownRight className="w-4 h-4" />
                  </button>
                </Td>
              </Tr>
            ))}
          </Table>
        </LoadState>
      </motion.div>

      {/* ── Reply Modal ── */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedReview(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              role="dialog" aria-modal="true" aria-label="Respond to feedback"
              className="relative w-full max-w-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Respond to Feedback</h3>
                <button onClick={() => setSelectedReview(null)} aria-label="Close" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm dark:text-white">{selectedReview.customer_name}</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(selectedReview.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">{selectedReview.review ? `"${selectedReview.review}"` : "No written review, just a rating."}</p>
              </div>

              <form onSubmit={handleReplySubmit}>
                <label htmlFor="reply" className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Your Reply</label>
                <textarea
                  id="reply"
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a professional response..."
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 mb-4"
                  required
                />
                {replyError && <p className="text-sm text-rose-600 dark:text-rose-400 mb-3">{replyError}</p>}
                <Button fullWidth type="submit" className="gap-2" loading={saving}>{selectedReview.reply ? "Update Reply" : "Post Reply"} <CornerDownRight className="w-4 h-4" /></Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
