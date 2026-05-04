import { STATUS_BADGE, STATUS_LABEL } from "../../data";

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[status] || "bg-slate-700 text-slate-300"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function Badge({ children, color = "slate" }) {
  const colors = {
    slate:   "bg-slate-700/60 text-slate-300",
    blue:    "bg-blue-500/15 text-blue-400",
    emerald: "bg-emerald-500/15 text-emerald-400",
    amber:   "bg-amber-500/15 text-amber-400",
    rose:    "bg-rose-500/15 text-rose-400",
    violet:  "bg-violet-500/15 text-violet-400",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
}
