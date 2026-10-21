import type { DocumentState } from "@/types/platform";

export const DOC_STATE_LABEL: Record<DocumentState, string> = {
  requested: "Awaiting upload",
  overdue: "Overdue",
  pending_review: "Pending review",
  verified: "Verified",
  expiring: "Expiring soon",
  expired: "Expired",
  rejected: "Rejected",
  superseded: "Replaced",
};

export const DOC_STATE_STYLE: Record<DocumentState, string> = {
  verified: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
  expiring: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400",
  pending_review: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400",
  requested: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
  overdue: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400",
  expired: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400",
  rejected: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400",
  superseded: "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500",
};

/** States where the dealer has to upload something. */
export const NEEDS_UPLOAD: DocumentState[] = ["requested", "overdue", "rejected"];
