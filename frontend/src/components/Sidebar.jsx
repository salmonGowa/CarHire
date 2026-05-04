import { NavLink } from "react-router-dom"; 
import { useAuth } from "./AuthContext";
import NAV_ITEMS, { ROLE_META } from "./NavITems";
import ICONS from "./SvgIcons";
import { useTheme } from "./ThemeContext";

import * as LucideIcons from "lucide-react";

const DynamicIcon = ({ name, className }) => {
  const IconComponent = LucideIcons[name] || LucideIcons.Circle;
  return <IconComponent className={className} strokeWidth={2} />;
};

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const role = user?.role || "customer";
  const items = NAV_ITEMS[role] || NAV_ITEMS.customer;
  const meta = ROLE_META[role] || ROLE_META.customer;

  const NavLinkItem = ({ item }) => (
    <NavLink
      to={`/${item.id}`}
      onClick={() => setMobileOpen(false)}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => `
        flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group
        ${isActive 
          ? "bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" 
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/80"
        }
      `}
    >
      {({ isActive }) => (
        <>
          <span className={`flex-shrink-0 transition-colors ${
            isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
          }`}>
            <DynamicIcon name={item.icon} className="w-5 h-5" />
          </span>
          {!collapsed && (
            <>
              <span className="truncate">{item.label}</span>
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 bg-blue-600 dark:bg-blue-400" />}
            </>
          )}
        </>
      )}
    </NavLink>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center border-b min-h-[64px] transition-colors border-slate-200 dark:border-slate-800 ${collapsed ? "justify-center px-3" : "justify-between px-5"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-16 h-12  rounded-lg flex items-center justify-centerfont-bold text-sm flex-shrink-0 shadow-md"><img src="/logo.png" alt="Logo" className="w-full h-full object-contain" /></div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">DriveFleet</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-7 h-7 rounded-md border items-center justify-center transition-colors bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
        >
          {collapsed ? <LucideIcons.ChevronRight className="w-4 h-4" /> : <LucideIcons.ChevronLeft className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex w-7 h-7 rounded-md border items-center justify-center transition-colors bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <LucideIcons.X className="w-4 h-4" />
        </button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className={`mx-4 mt-4 p-3 rounded-xl border transition-colors ${meta.bg} ${meta.border}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold uppercase shadow-sm ${meta.bg} ${meta.border} ${meta.color}`}>
              {user.name?.[0] || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLinkItem key={item.id} item={item} />
        ))}
      </nav>

      {/* Footer Actions */}
      <div className={`border-t p-3 space-y-1 transition-colors border-slate-200 dark:border-slate-800 ${collapsed ? "flex flex-col items-center" : ""}`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/80 ${collapsed ? "justify-center" : ""}`}
        >
          {isDark ? <LucideIcons.Sun className="w-5 h-5 text-amber-400" /> : <LucideIcons.Moon className="w-5 h-5 text-indigo-500" />}
          {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors border border-transparent text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:border-rose-500/20 ${collapsed ? "justify-center" : ""}`}
        >
          <LucideIcons.LogOut className="w-5 h-5 opacity-80" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:flex flex-col h-screen transition-all duration-300 flex-shrink-0 border-r bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800/80 ${collapsed ? "w-20" : "w-64"}`}>
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 border-r bg-white border-slate-200 dark:bg-[#0B1120] dark:border-slate-800 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>
    </>
  );
}