import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom"; 
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "./AuthContext";
import { appConfig } from "@/lib/appConfig";
import { Wrench } from "lucide-react";

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  
  const activeTab = location.pathname.split("/")[1] || "dashboard";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const { maintenance_mode: maintenance, maintenance_message: message } = appConfig.platform;
  if (maintenance && user.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#030712]">
        <div role="status" className="max-w-md text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center"><Wrench className="w-7 h-7" /></div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">We'll be right back</h1>
          <p className="text-slate-600 dark:text-slate-400">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-500 bg-slate-50 text-slate-900 dark:bg-[#030712] dark:text-slate-100">
     
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar
          activeTab={activeTab}
          onMenuOpen={() => setMobileOpen(true)}
        />
        

        {maintenance && (
          <div role="status" className="px-4 py-2 text-center text-xs font-bold bg-amber-500 text-amber-950">
            Maintenance mode is on. Customers and dealers are locked out until you turn it off in System Settings.
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}