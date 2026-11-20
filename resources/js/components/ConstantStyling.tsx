import type { SVGProps } from "react";
import { motion } from "framer-motion";


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