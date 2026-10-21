import type { SVGProps } from "react";
import { motion, type Variants } from "framer-motion";


export const sectionAccent = {
  blue:    "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  violet:  "bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  emerald: "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  amber:   "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  rose:    "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  slate:   "bg-slate-500/10 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
};



export interface StatusConfig {
  dot: string;
  badge: string;
  pulse: boolean;
}

export const STATUS_CFG: Record<string, StatusConfig> = {
  Moving: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    pulse: true,
  },
  Parked: {
    dot: "bg-slate-400",
    badge:
      "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400",
    pulse: false,
  },
  Idle: {
    dot: "bg-violet-500",
    badge:
      "bg-violet-100 dark:bg-violet-500/15 border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-violet-400",
    pulse: false,
  },
  Alert: {
    dot: "bg-rose-500",
    badge:
      "bg-rose-100 dark:bg-rose-500/15 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400",
    pulse: true,
  },
};

export const MAP_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a2035" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e3a5f" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1e3a6b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2563eb" }, { weight: 0.5 }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3b82f6" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#0f1a2b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0a1a0a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#060d1f" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#0f1a2b" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e3a5f" }],
  },
];

export const MAP_LIGHT_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f0f4f8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f0f4f8" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#e2e8f0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#bfdbfe" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3b82f6" }, { weight: 0.8 }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1d4ed8" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#e8eef5" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#d1fae5" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#dbeafe" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e8eef5" }],
  },
];

export const fade: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
};
export const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };


//  Heading arrow 
export const HeadingArrow = ({ degrees, color, size = 32 }: { degrees: number; color: string; size?: number }) => (
  <div
    className="relative flex items-center justify-center flex-shrink-0"
    style={{ width: size, height: size }}
  >
    <div
      className="absolute inset-0 rounded-full"
      style={{ background: `${color}1a`, border: `1px solid ${color}40` }}
    />
    <svg
      width={size * 0.55}
      height={size * 0.55}
      viewBox="0 0 16 16"
      style={{
        transform: `rotate(${degrees}deg)`,
        transition: "transform 0.6s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      <polygon points="8,1 12,13 8,11 4,13" fill={color} />
    </svg>
  </div>
);


//  SVG Icon 
export type IconPath = string | SVGProps<SVGCircleElement> | (string | SVGProps<SVGCircleElement>)[];

export const Icon = ({ d, size = 18, strokeWidth = 1.8, className = "", fill = "none" }: { d: IconPath; size?: number; strokeWidth?: number; className?: string; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {(Array.isArray(d) ? d : [d]).map((p, i) =>
      typeof p === "object" ? <circle key={i} {...p} /> : <path key={i} d={p} />
    )}
  </svg>
);

export const Spark = ({ data, color = "#3b82f6", height = 32, width = 80 }: { data: number[]; color?: string; height?: number; width?: number }) => {
  const max = Math.max(...data, 1);
  const uid = `sg${color.replace(/[^a-z0-9]/gi, "")}`;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * (width - 4) + 2;
      const y = height - 2 - (v / max) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`2,${height} ${pts} ${width - 2},${height}`}
        fill={`url(#${uid})`}
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};


// Gauge
export const Gauge = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const arc = Math.min(value / max, 1) * circ * 0.75;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="54" viewBox="0 0 72 54">
        <circle
          cx="36"
          cy="42"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-slate-200 dark:stroke-slate-800"
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeLinecap="round"
          transform="rotate(135 36 42)"
        />
        <motion.circle
          cx="36"
          cy="42"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`0 ${circ}`}
          animate={{ strokeDasharray: `${arc} ${circ}` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
          transform="rotate(135 36 42)"
        />
        <text
          x="36"
          y="46"
          textAnchor="middle"
          fontSize="11"
          fontWeight="900"
          className="fill-slate-800 dark:fill-white"
        >
          {value}
        </text>
      </svg>
      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
};



const ConstantStyling = () => {


  return (
    <div>ConstantStyling</div>
  )
}

export default ConstantStyling