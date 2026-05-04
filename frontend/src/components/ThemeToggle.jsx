import { useTheme } from "./ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ size = "md" }) {
  const { isDark, toggleTheme } = useTheme();  
  
  const iconClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={[
        "rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200",
        "bg-slate-100 dark:bg-slate-800",
        "border border-slate-200 dark:border-slate-700",
        "text-slate-500 dark:text-slate-400",
        "hover:bg-slate-200 dark:hover:bg-slate-700",
        "hover:text-blue-600 dark:hover:text-blue-400",
        size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base",
      ].join(" ")}
    >
      {isDark ? (
        <Sun className={iconClass} strokeWidth={2} />
      ) : (
        <Moon className={iconClass} strokeWidth={2} />
      )}
    </button>
  );
}