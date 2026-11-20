import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Menu, Bell, Info, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import NAV_ITEMS from "./NavITems";
import GlobalSearch from "./GlobalSearch";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { dateTime } from "@/lib/format";
import type { AppNotification } from "@/types/account";

const TYPE_ICONS: Record<AppNotification["tone"], ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-500" />,
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  error: <ShieldAlert className="w-4 h-4 text-rose-500" />,
};

interface NotificationList {
  data: AppNotification[];
  unread: number;
}

export default function TopBar({ activeTab, onMenuOpen }: { activeTab: string; onMenuOpen: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const { data, setData, reload } = useApi<NotificationList>("/api/notifications");

  // Check for new notifications every minute while the app is open.
  useEffect(() => {
    const timer = window.setInterval(reload, 60_000);
    return () => window.clearInterval(timer);
  }, [reload]);

  const notifs = data?.data ?? [];
  const unreadCount = data?.unread ?? 0;
  const navItems = user ? (NAV_ITEMS as Record<string, { id: string; label: string }[]>)[user.role] ?? [] : [];
  const title = activeTab === "dashboard" ? "Dashboard" : navItems.find((n) => n.id === activeTab)?.label ?? "Dashboard";

  const open = async (n: AppNotification) => {
    setNotifOpen(false);
    if (!n.read) {
      api<NotificationList>(`/api/notifications/${n.id}/read`, { method: "POST" }).then(setData).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };
  const markAll = () => api<NotificationList>("/api/notifications/read-all", { method: "POST" }).then(setData).catch(() => {});

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

      {/* Search */}
      {user && <GlobalSearch role={user.role} />}

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) reload(); }}
            aria-label={unreadCount ? `Notifications (${unreadCount} unread)` : "Notifications"}
            className="w-10 h-10 rounded-xl border flex items-center justify-center transition-colors relative bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-[#0B1120] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-12 w-80 border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:shadow-black/50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
                  {unreadCount > 0 && <button onClick={markAll} className="text-xs text-blue-600 hover:text-blue-500 font-medium dark:text-blue-400">Mark all read</button>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length > 0 ? notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => open(n)}
                      className={`w-full text-left flex gap-3 px-4 py-3 border-b last:border-0 transition-colors border-slate-100 hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/40 ${n.read ? "" : "bg-blue-50/50 dark:bg-blue-500/10"}`}
                    >
                      <span className="flex-shrink-0 mt-0.5">{TYPE_ICONS[n.tone] ?? TYPE_ICONS.info}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug text-slate-800 dark:text-slate-200">{n.title}</p>
                        <p className="text-xs leading-snug text-slate-600 dark:text-slate-400 mt-0.5">{n.body}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{dateTime(n.at)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 flex-shrink-0 mt-1.5 ml-auto" />}
                    </button>
                  )) : (
                    <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">You're all caught up.</div>
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