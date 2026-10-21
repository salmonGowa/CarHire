
import { motion } from "framer-motion";
import { STATUS_CFG, HeadingArrow, fade, Icon, Spark } from "./ConstantStyling";
import type { Vehicle } from "@/data";

const VehicleCard = ({ v, selected, onClick }: { v: Vehicle; selected: boolean; onClick: () => void }) => {
  const hasAlert = v.alerts.length > 0;
  const cfg = hasAlert ? STATUS_CFG.Alert : STATUS_CFG[v.status];
  return (
    <motion.div
      variants={fade}
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden
        ${
          selected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-lg shadow-blue-100 dark:shadow-blue-900/30"
            : hasAlert
              ? "border-rose-300 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-600/60"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none"
        }`}
    >
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
      )}

      <div className="flex items-start justify-between mb-2.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <HeadingArrow degrees={v.heading} color={v.color} size={30} />
          <div>
            <p className="font-black text-slate-900 dark:text-white text-sm leading-none">
              {v.model}
            </p>
            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
              {v.plate}
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${cfg.badge}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""} flex-shrink-0`}
          />
          {hasAlert ? "Alert" : v.status}
        </div>
      </div>

      <p className="text-[10px] text-slate-500 flex items-center gap-1 mb-3 truncate relative z-10">
        <Icon
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          size={11}
          className="flex-shrink-0"
        />
        <span className="truncate">{v.location}</span>
      </p>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Icon
              d="M13 10V3L4 14h7v7l9-11h-7z"
              size={11}
              className="text-amber-500 flex-shrink-0"
            />
            {v.speed}
            <span className="text-slate-400 dark:text-slate-600"> km/h</span>
          </span>
          <span
            className={`text-[10px] font-bold flex items-center gap-1 ${v.battery < 30 ? "text-rose-500" : "text-slate-500 dark:text-slate-400"}`}
          >
            <Icon
              d="M23 7l-7 5 7 5V7z M1 5h15a2 2 0 012 2v10a2 2 0 01-2 2H1V5z"
              size={11}
              className="flex-shrink-0"
            />
            {v.battery}%
          </span>
        </div>
        <Spark data={v.speedHistory} color={v.color} height={20} width={50} />
      </div>

      {hasAlert && (
        <div className="mt-2.5 pt-2.5 border-t border-rose-200 dark:border-rose-900/40 relative z-10">
          <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <Icon
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              size={11}
              className="flex-shrink-0"
            />
            <span className="truncate">{v.alerts[0].msg}</span>
          </p>
        </div>
      )}
    </motion.div>
  );
};
export default VehicleCard;