const colorMap = {
  blue:    { icon: "bg-blue-500/15 text-blue-400",    glow: "group-hover:border-blue-500/40" },
  emerald: { icon: "bg-emerald-500/15 text-emerald-400", glow: "group-hover:border-emerald-500/40" },
  amber:   { icon: "bg-amber-500/15 text-amber-400",  glow: "group-hover:border-amber-500/40" },
  rose:    { icon: "bg-rose-500/15 text-rose-400",    glow: "group-hover:border-rose-500/40" },
  violet:  { icon: "bg-violet-500/15 text-violet-400", glow: "group-hover:border-violet-500/40" },
};

export default function StatCard({ title, value, change, icon, color = "blue", subtitle }) {
  const c = colorMap[color] || colorMap.blue;
  const isPos = change && change.startsWith("+");

  return (
    <div className={`group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 cursor-default overflow-hidden ${c.glow}`}>
      {/* Bg glow blob */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-xl pointer-events-none"
        style={{ background: color === "blue" ? "#3b82f6" : color === "emerald" ? "#10b981" : color === "amber" ? "#f59e0b" : color === "rose" ? "#ef4444" : "#8b5cf6" }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${c.icon}`}>
            {icon}
          </div>
          {change && (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPos ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
              {change}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-slate-100 font-display leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-1.5">{title}</p>
        {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
