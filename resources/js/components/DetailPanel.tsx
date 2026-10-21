import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STATUS_CFG, HeadingArrow, Gauge, Spark, Icon } from "./ConstantStyling";
import { TRIP_HISTORY, type Vehicle } from "@/data";

const DetailPanel = ({ v, onCommand }: { v: Vehicle; onCommand: (cmd: string, vehicleId: number) => void }) => {
  const [tab, setTab] = useState("telemetry");
  const TABS = ["telemetry", "driver", "trip", "history"];

  const panelBase =
    "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none";
  const cardBase =
    "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800";
  const textMain = "text-slate-900 dark:text-white";
  const textSub = "text-slate-500 dark:text-slate-500";
  const labelCls =
    "text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest";

  return (
    <motion.div
      key={v.id}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`flex flex-col h-[500px] lg:h-full rounded-2xl overflow-hidden ${panelBase}`}
    >
      {/* Header */}
      <div
        className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${v.color}10, transparent)`,
        }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono">
              {v.plate}
            </span>
            {v.geofence.breached && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800/50 uppercase tracking-wider">
                Breach
              </span>
            )}
          </div>
          <h3 className={`font-black text-lg leading-none ${textMain}`}>
            {v.model}
          </h3>
          <p className={`text-[11px] mt-0.5 ${textSub}`}>
            {v.type} · {v.dealer}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <HeadingArrow degrees={v.heading} color={v.color} size={36} />
          <span className="text-[9px] text-slate-400 dark:text-slate-600 font-bold">
            {v.heading}°
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-transparent flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all capitalize
              ${
                tab === t
                  ? `${textMain} border-b-2 -mb-px bg-white dark:bg-transparent`
                  : `text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400`
              }`}
            style={tab === t ? { borderColor: v.color } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === "telemetry" && (
            <motion.div
              key="tel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              <div className="flex items-center justify-around py-2">
                <Gauge
                  value={v.speed}
                  max={120}
                  label="Speed"
                  color={v.color}
                />
                <Gauge
                  value={v.fuel}
                  max={100}
                  label="Fuel"
                  color={v.fuel < 40 ? "#ef4444" : "#10b981"}
                />
                <Gauge
                  value={v.battery}
                  max={100}
                  label="Battery"
                  color={v.battery < 30 ? "#ef4444" : "#3b82f6"}
                />
              </div>

              <div className={`p-3.5 rounded-xl ${cardBase}`}>
                <p className={`${labelCls} mb-2`}>Speed History</p>
                <div className="w-full flex justify-center">
                  <Spark
                    data={v.speedHistory}
                    color={v.color}
                    height={40}
                    width={220}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[9px] ${textSub}`}>–9 min</span>
                  <span className={`text-[9px] ${textSub}`}>Now</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    label: "Engine",
                    value: v.engine,
                    color:
                      v.engine === "On"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400",
                    icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5m4 0h6m4-8v8m0 0h-4m4 0v3",
                  },
                  {
                    label: "Signal",
                    value: v.signal,
                    color:
                      v.signal === "Strong"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400",
                    icon: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
                  },
                  {
                    label: "Odometer",
                    value: `${v.odometer.toLocaleString()} km`,
                    color: textMain,
                    icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
                  },
                  {
                    label: "Geofence",
                    value: v.geofence.name,
                    color: v.geofence.breached
                      ? "text-rose-600 dark:text-rose-400"
                      : textMain,
                    icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
                  },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} className={`p-3 rounded-xl ${cardBase}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon
                        d={icon}
                        size={11}
                        className="text-slate-400 dark:text-slate-600"
                      />
                      <p className={labelCls}>{label}</p>
                    </div>
                    <p className={`text-sm font-black truncate ${color}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {v.alerts.length > 0 && (
                <div className="space-y-2">
                  {v.alerts.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold
                      ${
                        a.type === "error"
                          ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800/50 text-rose-600 dark:text-rose-400"
                          : "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800/50 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <Icon
                        d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        size={14}
                        className="flex-shrink-0"
                      />
                      <span className="truncate">{a.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "driver" && (
            <motion.div
              key="drv"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              {v.driver ? (
                <>
                  <div
                    className={`flex items-center gap-4 p-4 rounded-xl ${cardBase}`}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${v.color}, ${v.color}99)`,
                      }}
                    >
                      {v.driver.avatar}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-black text-base truncate ${textMain}`}
                      >
                        {v.driver.name}
                      </p>
                      <p className={`text-[10px] mt-0.5 truncate ${textSub}`}>
                        {v.driver.id}
                      </p>
                      <p className={`text-xs mt-1 truncate ${textSub}`}>
                        {v.driver.phone}
                      </p>
                    </div>
                  </div>
                  {v.client && (
                    <div className={`p-4 rounded-xl ${cardBase}`}>
                      <p className={`${labelCls} mb-2`}>Active Client</p>
                      <p className={`font-bold text-sm truncate ${textMain}`}>
                        {v.client.name}
                      </p>
                      <p className={`text-[10px] mt-0.5 truncate ${textSub}`}>
                        {v.client.id}
                      </p>
                      {v.tripBookingId && (
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-bold truncate">
                          Booking: {v.tripBookingId}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-700/40 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-600/30 transition-colors">
                      <Icon
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        size={13}
                      />
                      Call Driver
                    </button>
                    <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Icon
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03-8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        size={13}
                      />
                      Message
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${cardBase}`}
                  >
                    <Icon
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      size={24}
                      className="text-slate-300 dark:text-slate-700"
                    />
                  </div>
                  <p className={`text-sm font-bold ${textSub}`}>
                    No Active Driver
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-700 mt-1">
                    Vehicle is unassigned
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {tab === "trip" && (
            <motion.div
              key="trp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Trip Start", value: v.tripStart },
                  { label: "Duration", value: v.tripDuration },
                  {
                    label: "Distance",
                    value: v.tripDistance ? `${v.tripDistance} km` : "—",
                  },
                  { label: "Booking", value: v.tripBookingId || "—" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className={`p-3 rounded-xl min-w-0 ${cardBase}`}
                  >
                    <p className={`${labelCls} mb-1 truncate`}>{label}</p>
                    <p className={`text-sm font-black truncate ${textMain}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className={`p-4 rounded-xl min-w-0 ${cardBase}`}>
                <p className={`${labelCls} mb-2`}>GPS Coordinates</p>
                <p
                  className={`text-xs font-bold font-mono truncate ${textMain}`}
                >
                  {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                </p>
                <p className={`text-[10px] mt-0.5 truncate ${textSub}`}>
                  {v.location}
                </p>
              </div>
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div
              key="his"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3"
            >
              <p className={labelCls}>Recent Trips</p>
              {TRIP_HISTORY.map((t) => (
                <div key={t.id} className={`p-3.5 rounded-xl ${cardBase}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[9px] font-bold font-mono ${textSub}`}
                    >
                      {t.id}
                    </span>
                    <span className={`text-[9px] ${textSub}`}>{t.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-700 flex-shrink-0" />
                    <span className={`text-xs font-bold truncate ${textSub}`}>
                      {t.from}
                    </span>
                    <Icon
                      d="M9 5l7 7-7 7"
                      size={12}
                      className="text-slate-400 dark:text-slate-700 flex-shrink-0"
                    />
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: v.color }}
                    />
                    <span className={`text-xs font-bold truncate ${textMain}`}>
                      {t.to}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {[
                      t.distance,
                      t.duration,
                      `Max ${t.maxSpeed}km/h`,
                      `Avg ${t.avgSpeed}km/h`,
                    ].map((s, i) => (
                      <span key={i} className={`text-[10px] ${textSub}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Remote commands */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950 flex-shrink-0">
        <p className={`${labelCls} mb-2.5`}>Remote Commands</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Lock",
              icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
              cls: "bg-rose-50 dark:bg-rose-600/20 border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-600/30",
              cmd: "lock",
            },
            {
              label: "Horn",
              icon: "M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12m-6.536-5.536a5 5 0 010-7.072",
              cls: "bg-amber-50 dark:bg-amber-600/20 border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-600/30",
              cmd: "horn",
            },
            {
              label: "Lights",
              icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
              cls: "bg-blue-50 dark:bg-blue-600/20 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-600/30",
              cmd: "lights",
            },
          ].map((b) => (
            <button
              key={b.label}
              onClick={() => onCommand(b.cmd, v.id)}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all ${b.cls}`}
            >
              <Icon d={b.icon} size={16} />
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DetailPanel;