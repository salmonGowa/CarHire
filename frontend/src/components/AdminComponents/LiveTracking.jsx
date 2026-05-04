import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {Search,Layers,Maximize,MapPin,Zap,Battery,AlertTriangle,Cpu,Wifi,Map,Phone,MessageSquare,User,ChevronRight,Lock,Volume2,Lightbulb,CheckCircle2, ArrowLeft,
} from "lucide-react";
import { Icon, MAP_DARK_STYLE, MAP_LIGHT_STYLE, stagger, STATUS_CFG } from "../ConstantStyling";
import DetailPanel from "../DetailPanel";
import VehicleCard from "../VehicleCard";
import { VEHICLES_SEED } from "../../../data";






//  Google Maps Canvas
const GOOGLE_MAPS_API_KEY = "AIzaSyCbk0a8iSlkRnjxM7HW4nQG8GLKYa32_14";

const GoogleMapCanvas = ({
  vehicles,
  selectedId,
  onSelect,
  isDark,
  alerts,
}) => {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef({});
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  const buildMarkerSvg = (v, isSelected) => {
    const hasAlert = v.alerts.length > 0;
    const c = hasAlert ? "#ef4444" : v.color;
    const s = isSelected ? 1.2 : 1;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(44 * s)}" height="${Math.round(52 * s)}" viewBox="0 0 44 52">
      <defs>
        <filter id="ds"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${c}" flood-opacity="0.5"/></filter>
      </defs>
      <g filter="url(#ds)">
        <path d="M22 2C13.2 2 6 9.2 6 18c0 12 16 32 16 32S38 30 38 18C38 9.2 30.8 2 22 2z" fill="${c}"/>
        <circle cx="22" cy="18" r="9" fill="white" fill-opacity="0.96"/>
        <circle cx="22" cy="18" r="5" fill="${c}"/>
      </g>
      ${isSelected ? `<circle cx="22" cy="18" r="14" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.5"/>` : ""}
      ${hasAlert ? `<circle cx="34" cy="8" r="7" fill="#ef4444" stroke="white" stroke-width="2"/><text x="34" y="12" text-anchor="middle" font-size="9" font-weight="900" fill="white">!</text>` : ""}
    </svg>`;
  };

  const initMap = useCallback(() => {
    if (!mapRef.current || instanceRef.current || !window.google?.maps) return;

    instanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: -1.2921, lng: 36.8219 },
      zoom: 12,
      styles: isDark ? MAP_DARK_STYLE : MAP_LIGHT_STYLE,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      gestureHandling: "greedy",
    });

    vehicles.forEach((v) => {
      const isSelected = v.id === selectedId;
      const svg = buildMarkerSvg(v, isSelected);
      const sz = isSelected ? [53, 62] : [44, 52];
      const marker = new window.google.maps.Marker({
        position: { lat: v.lat, lng: v.lng },
        map: instanceRef.current,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new window.google.maps.Size(sz[0], sz[1]),
          anchor: new window.google.maps.Point(sz[0] / 2, sz[1]),
        },
        title: `${v.model} · ${v.plate}`,
        zIndex: isSelected ? 999 : 1,
      });
      marker.addListener("click", () => onSelect(v.id));
      markersRef.current[v.id] = marker;
    });

    setReady(true);
  }, []); 

  // Load Google maps script once
  useEffect(() => {
    if (window.google?.maps) {
      initMap();
      return;
    }
    if (document.querySelector(`script[src*="maps.googleapis"]`)) {
      window.__gmapCb = initMap;
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=__gmapCb`;
    script.async = true;
    script.defer = true;
    window.__gmapCb = () => {
      delete window.__gmapCb;
      initMap();
    };
    script.onerror = () => setLoadErr(true);
    document.head.appendChild(script);
    const timeout = setTimeout(() => {
      if (!window.google?.maps) setLoadErr(true);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [initMap]);

  // to theme change
  useEffect(() => {
    if (!instanceRef.current) return;
    instanceRef.current.setOptions({
      styles: isDark ? MAP_DARK_STYLE : MAP_LIGHT_STYLE,
    });
  }, [isDark]);

  // Pan + update marker when selected changes
  useEffect(() => {
    if (!instanceRef.current) return;
    const sel = vehicles.find((v) => v.id === selectedId);
    if (sel) instanceRef.current.panTo({ lat: sel.lat, lng: sel.lng });

    vehicles.forEach((v) => {
      const marker = markersRef.current[v.id];
      if (!marker) return;
      const isSelected = v.id === selectedId;
      const svg = buildMarkerSvg(v, isSelected);
      const sz = isSelected ? [53, 62] : [44, 52];
      marker.setIcon({
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        scaledSize: new window.google.maps.Size(sz[0], sz[1]),
        anchor: new window.google.maps.Point(sz[0] / 2, sz[1]),
      });
      marker.setZIndex(isSelected ? 999 : 1);
    });
  }, [selectedId, vehicles]); 

  // Fallback map (no API key / load error) 
  const FallbackMap = () => {
    const DUMMY_POSITIONS = [
      { left: "44%", top: "42%" },
      { left: "74%", top: "76%" },
      { left: "70%", top: "20%" },
      { left: "26%", top: "60%" },
      { left: "52%", top: "54%" },
    ];
    const ROADS = [
      "M5,50 Q25,28 50,50 T95,50",
      "M50,5 L50,95",
      "M10,28 L90,72",
      "M18,80 Q42,58 66,80 T95,80",
      "M22,12 Q50,50 78,88",
      "M0,50 L100,50",
    ];
    return (
      <div
        className={`absolute inset-0 ${isDark ? "bg-[#0d1117]" : "bg-[#f0f4f8]"} overflow-hidden`}
      >
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="fb-grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke={isDark ? "#3b82f6" : "#94a3b8"}
                strokeWidth="0.25"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#fb-grid)" />
          {ROADS.map((r, i) => (
            <g key={i}>
              <path
                d={r}
                fill="none"
                stroke={isDark ? "#1e3a5f" : "#cbd5e1"}
                strokeWidth="3"
              />
              <path
                d={r}
                fill="none"
                stroke={isDark ? "#3b82f6" : "#93c5fd"}
                strokeWidth="0.7"
                opacity="0.7"
              />
            </g>
          ))}
          {[
            [-1.2674, 36.8033, "44%", "42%"],
            [-1.4548, 36.987, "74%", "76%"],
            [-1.2122, 36.8863, "70%", "20%"],
            [-1.3167, 36.7195, "26%", "60%"],
            [-1.2921, 36.7851, "52%", "54%"],
          ].map((_, i) => (
            <circle
              key={i}
              cx={parseFloat(DUMMY_POSITIONS[i].left)}
              cy={parseFloat(DUMMY_POSITIONS[i].top)}
              r="0.6"
              fill={isDark ? "#475569" : "#94a3b8"}
              opacity="0.6"
            />
          ))}
        </svg>

        {/* Vehicle pins */}
        {vehicles.map((v, i) => {
          const pos = DUMMY_POSITIONS[i] || { left: "50%", top: "50%" };
          const isSel = v.id === selectedId;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 ${isSel ? "scale-125 z-10" : "z-0 hover:scale-110"}`}
              style={pos}
            >
              <svg
                width={isSel ? 48 : 38}
                height={isSel ? 58 : 46}
                viewBox="0 0 44 52"
              >
                <defs>
                  <filter id={`pin-shadow-${v.id}`}>
                    <feDropShadow
                      dx="0"
                      dy="2"
                      stdDeviation="3"
                      floodColor={v.color}
                      floodOpacity="0.5"
                    />
                  </filter>
                </defs>
                <g filter={`url(#pin-shadow-${v.id})`}>
                  <path
                    d="M22 2C13.2 2 6 9.2 6 18c0 12 16 32 16 32S38 30 38 18C38 9.2 30.8 2 22 2z"
                    fill={v.color}
                  />
                  <circle
                    cx="22"
                    cy="18"
                    r="9"
                    fill="white"
                    fillOpacity="0.95"
                  />
                  <circle cx="22" cy="18" r="5" fill={v.color} />
                </g>
                {isSel && (
                  <circle
                    cx="22"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={v.color}
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                )}
                {v.alerts.length > 0 && (
                  <>
                    <circle
                      cx="34"
                      cy="8"
                      r="7"
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x="34"
                      y="12"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="900"
                      fill="white"
                    >
                      !
                    </text>
                  </>
                )}
              </svg>
              {isSel && (
                <div
                  className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap shadow-lg
                  ${isDark ? "bg-slate-900 text-white border border-slate-700" : "bg-white text-slate-800 border border-slate-200"}`}
                >
                  {v.plate}
                </div>
              )}
            </button>
          );
        })}

        {/* API notice */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[80%] lg:w-auto text-center">
          <div
            className={`inline-block px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur border
            ${isDark ? "bg-slate-900/80 text-slate-400 border-slate-700" : "bg-white/80 text-slate-500 border-slate-200 shadow-sm"}`}
          >
            Add your Google Maps API key to load live map
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
      {/* Google Maps container */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Show fallback while loading / on error */}
      {(loadErr || !ready) && <FallbackMap />}

      {/* Alert banner */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            key="alert"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90%] sm:w-auto"
          >
            <div className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-xl bg-rose-600/90 backdrop-blur-sm border border-rose-400/30 shadow-xl">
              <Search size={13} className="absolute..." />

              <span className="text-white text-xs font-black truncate">
                {alerts[0].msg}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status pill */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none hidden sm:block">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-sm border
          ${isDark ? "bg-slate-900/80 border-slate-700/50" : "bg-white/85 border-slate-200/80"}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span
            className={`text-[10px] font-bold tracking-wider ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            LIVE · 99.9% UPTIME
          </span>
        </div>
      </div>

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        {[
          { icon: Search, title: "Search area" },
          { icon: Layers, title: "Layers" },
          { icon: Maximize, title: "Fit all" },
        ].map((b, i) => {
          const IconCmp = b.icon; 
          return (
            <button key={i} title={b.title} className="...">
              <IconCmp size={14} />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className={`absolute bottom-4 right-4 z-20 hidden sm:flex flex-col gap-1.5 p-3 rounded-xl backdrop-blur-md border
        ${isDark ? "bg-slate-900/80 border-slate-700/50" : "bg-white/85 border-slate-200/80 shadow-sm"}`}
      >
        {Object.entries(STATUS_CFG).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
            <span
              className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {k}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

//  Vehicle list card 

//  Detail panel 



export default function LiveTracking() {
  const [vehicles, setVehicles] = useState(VEHICLES_SEED);
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [isDark, setIsDark] = useState(false);


  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  // Live speed simulation
  useEffect(() => {
    const id = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status !== "Moving") return v;
          const ns = Math.max(
            5,
            Math.min(120, v.speed + (Math.random() - 0.5) * 6),
          );
          return {
            ...v,
            speed: Math.round(ns),
            speedHistory: [...v.speedHistory.slice(1), Math.round(ns)],
            fuel: parseFloat(Math.max(0, v.fuel - 0.01).toFixed(2)),
          };
        }),
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const selected = vehicles.find((v) => v.id === selectedId);
  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const ms =
      !q ||
      v.model.toLowerCase().includes(q) ||
      v.plate.toLowerCase().includes(q) ||
      (v.driver?.name.toLowerCase().includes(q) ?? false);
    const mf =
      filter === "all" ||
      v.status.toLowerCase() === filter ||
      (filter === "alerts" && v.alerts.length > 0);
    return ms && mf;
  });
  const allAlerts = vehicles.flatMap((v) =>
    v.alerts.map((a) => ({ ...a, vehicle: v.plate })),
  );
  const movingCount = vehicles.filter((v) => v.status === "Moving").length;
  const alertCount = allAlerts.length;

  const handleCommand = (cmd, vehicleId) => {
    const v = vehicles.find((x) => x.id === vehicleId);
    setToast({ cmd, plate: v?.plate });
    setTimeout(() => setToast(null), 3000);
  };

  const rootBg = isDark ? "bg-[#030812]" : "bg-slate-100/60";

  return (
    <div
      className={`flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-80px)] min-h-[calc(100vh-80px)] overflow-y-auto lg:overflow-hidden gap-4 p-2 lg:p-1 transition-colors ${rootBg}`}
    >
      {/*Col 1: Vehicle list ── */}
      <div className="order-3 lg:order-1 w-full lg:w-[280px] h-[500px] lg:h-full flex-shrink-0 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Live Fleet
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {movingCount} moving · {alertCount} alert
              {alertCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
              Live
            </span>
          </div>
        </div>

        <div className="relative">
          <Icon
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Plate, model, driver…"
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-400 dark:focus:border-blue-600 transition-colors shadow-sm dark:shadow-none"
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "All", value: "all" },
            { label: "Moving", value: "moving" },
            { label: "Parked", value: "parked" },
            { label: "Alerts", value: "alerts" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border
                ${
                  filter === f.value
                    ? "bg-slate-900 dark:bg-blue-600 border-slate-900 dark:border-blue-600 text-white"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none"
                }`}
            >
              {f.label}
              {f.value === "alerts" && alertCount > 0 && (
                <span className="ml-1 px-1 rounded bg-rose-500 text-[8px] font-black text-white">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex-1 overflow-y-auto space-y-2.5 pr-1"
        >
          {filtered.map((v) => (
            <VehicleCard
              key={v.id}
              v={v}
              selected={selectedId === v.id}
              onClick={() => setSelectedId(v.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400 dark:text-slate-600 text-xs">
              No vehicles match
            </div>
          )}
        </motion.div>
      </div>

      {/*Col 2: Map */}
      <div className="order-1 lg:order-2 w-full h-[400px] lg:h-full lg:flex-1 min-w-0 relative flex-shrink-0 lg:flex-shrink rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        <GoogleMapCanvas
          vehicles={vehicles}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isDark={isDark}
          alerts={allAlerts}
        />
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white shadow-xl z-30 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 text-center sm:text-left"
            >
              <div className="flex items-center justify-center gap-2">
                <Icon
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  size={14}
                  className="text-emerald-500 flex-shrink-0"
                />
                <span>
                  Command{" "}
                  <span className="uppercase text-emerald-600 dark:text-emerald-400 ml-0.5">
                    {toast.cmd}
                  </span>
                </span>
              </div>
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500 mx-1">
                <ArrowLeft size={12} />
              </span>
              <span className="mt-1 sm:mt-0 text-slate-500 dark:text-slate-400">
                sent to {toast.plate}
              </span>
              <span className="mt-1 sm:mt-0">{toast.plate}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*Col 3: Detail panel */}
      <div className="order-2 lg:order-3 w-full lg:w-[280px] flex-shrink-0">
        <AnimatePresence mode="wait">
          {selected && (
            <DetailPanel
              key={selected.id}
              v={selected}
              onCommand={handleCommand}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
