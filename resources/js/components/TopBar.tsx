import { useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { Menu, Bell, Search, Info, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { NOTIFS, TAB_TITLES } from "@/data";

const TYPE_ICONS: Record<string, ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-500" />,
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  danger: <ShieldAlert className="w-4 h-4 text-rose-500" />,
};

export default function TopBar({ activeTab, onMenuOpen }: { activeTab: string; onMenuOpen: () => void }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  
  const unreadCount = NOTIFS?.filter((n) => n.unread).length || 0;
  const title = TAB_TITLES?.[activeTab] || "Dashboard";

  return (
    <header className="h-16 min-h-[64px] border-b flex items-center px-5 gap-4 sticky top-0 z-30 transition-colors duration-300 bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80">
      
      {/* Mobile Hamburger */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden flex items-center justify-center p-2 -ml-2 rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold truncate text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="text-xs hidden sm:block text-slate-500 dark:text-slate-400">DriveFleet Management</p>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex items-center gap-2 px-3 py-2 border rounded-xl w-full max-w-sm transition-colors bg-slate-50 border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:bg-slate-900/50 dark:border-slate-800 dark:focus-within:border-blue-500/50">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          placeholder="Search bookings, users, or vehicles..."
          className="bg-transparent outline-none text-sm w-full placeholder-slate-400 text-slate-800 dark:text-slate-200 dark:placeholder-slate-500"
        />
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-10 h-10 rounded-xl border flex items-center justify-center transition-colors relative bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#0B1120]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-12 w-80 border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:shadow-black/50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
                  <button className="text-xs text-blue-600 hover:text-blue-500 font-medium dark:text-blue-400">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {NOTIFS?.length > 0 ? NOTIFS.map((n, i) => (
                    <div 
                      key={i} 
                      className={`flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors border-slate-100 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/40 ${n.unread ? "bg-blue-50/50 dark:bg-blue-500/10" : ""}`}
                    >
                      <span className="flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || TYPE_ICONS.info}</span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug text-slate-700 dark:text-slate-300">{n.text}</p>
                        <p className="text-[11px] text-slate-500 mt-1 dark:text-slate-500">{n.time}</p>
                      </div>
                      {n.unread && <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0 mt-1.5 ml-auto" />}
                    </div>
                  )) : (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No new notifications</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Avatar Placeholder */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold uppercase cursor-pointer flex-shrink-0 shadow-md">
          {user?.name?.[0] || "U"}
        </div>
      </div>
    </header>
  );
}