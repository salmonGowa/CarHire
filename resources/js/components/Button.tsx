import type { MouseEventHandler, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "gold";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:   "bg-blue-600 hover:bg-blue-500 text-white border border-blue-600 hover:border-blue-500",
  secondary: "bg-white/5 dark:bg-slate-800 hover:bg-white/10 text-slate-200 border border-slate-700 hover:border-slate-500",
  ghost:     "bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent",
  danger:    "bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40",
  success:   "bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/40",
  gold:      "bg-amber-500 hover:bg-amber-400 text-black border border-amber-500",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-7 px-3 text-xs gap-1.5",
  sm: "h-8 px-4 text-sm gap-2",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
};

export default function Button({
  children, onClick, variant = "primary", size = "md",
  disabled = false, loading = false, fullWidth = false,
  type = "button", className = "",
}: {
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
