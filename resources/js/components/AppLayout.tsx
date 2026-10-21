import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom"; 
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAuth } from "./AuthContext";

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  
  const activeTab = location.pathname.split("/")[1] || "dashboard";

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

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
        

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}