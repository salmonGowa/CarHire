import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

/** Centred card used by the password pages; matches the sign-in screen. */
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${isDark ? "bg-[#030712]" : "bg-slate-50"}`}>
      <div className="absolute -top-64 -left-64 w-[48rem] h-[48rem] pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${isDark ? "rgba(37,99,235,0.18)" : "rgba(96,165,250,0.22)"}, transparent)` }} />
      <div className="absolute -bottom-64 -right-64 w-[44rem] h-[44rem] pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${isDark ? "rgba(124,58,237,0.18)" : "rgba(167,139,250,0.22)"}, transparent)` }} />
      <main className={`relative w-full max-w-md rounded-3xl border p-8 sm:p-10 shadow-xl ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="" className="h-8 w-auto" />
              <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>DriveFleet</span>
            </Link>
            <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h1>
            <p className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
          </div>
          <button onClick={toggleTheme} aria-label="Toggle theme"
            className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${isDark ? "bg-slate-900 border-slate-800 text-amber-400" : "bg-slate-50 border-slate-200 text-indigo-500"}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
