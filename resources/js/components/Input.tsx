import { useId, useState, type ChangeEventHandler, type ReactNode } from "react";
import ICONS from "./SvgIcons";

interface InputProps {
  label?: ReactNode;
  type?: string;
  value?: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  error?: ReactNode;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
  min?: string | number;
  max?: string | number;
  className?: string;
}

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  icon, // ✅ No longer aliased to an uppercase Component
  required = false,
  disabled = false,
  name,
  autoComplete,
  min,
  max,
  className = "",
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const inputId = useId();

  // Toggle type between text and password
  const actualType = type === "password" ? (showPwd ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-600 dark:text-slate-400 tracking-wide">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* ✅ Render the passed-in icon directly as a node */}
        {icon && (
          <span
            className={`absolute left-3 flex items-center justify-center transition-colors ${
              focused ? "text-blue-400" : "text-slate-500"
            }`}
          >
            {icon}
          </span>
        )}

        <input
          id={inputId}
          type={actualType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          min={min}
          max={max}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={[
            "w-full h-11 bg-white dark:bg-slate-800/60 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200",
            icon ? "pl-9" : "pl-3.5",
            type === "password" ? "pr-10" : "pr-3.5",
            error
              ? "border-rose-500 focus:ring-2 focus:ring-rose-500/25"
              : "border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
            disabled ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
        />

        {/* Password Visibility Toggle */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? "Hide password" : "Show password"}
            className="absolute right-3 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors focus:outline-none"
          >
            {showPwd ? (
              <ICONS.EyeOff className="w-5 h-5" />
            ) : (
              <ICONS.Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {error && (
        <span className="text-xs text-rose-400 flex items-center gap-1 mt-1">
          <ICONS.AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </span>
      )}
    </div>
  );
}