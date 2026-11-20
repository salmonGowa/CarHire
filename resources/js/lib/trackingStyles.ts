import type { Variants } from "framer-motion";

// Shared styles for the fleet tracking views (Live Tracking, vehicle cards, detail panel).

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
