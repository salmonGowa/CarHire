import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { ThemeProvider } from "./components/ThemeContext";

import AppLayout from "./components/AppLayout";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import LandingPage from "./pages/LandingPage";

// Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import DealerDashboard from "./pages/DealerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

// Customer Components
import CustomerProfile from "./components/CustomerComponents/CustomerProfile";
import CustomerSaved from "./components/CustomerComponents/CustomerSaved";
import PreferencesSection from "./components/CustomerComponents/CustomerPreference";
import GlobalRevenue from "./components/SuperAdminComponents/GlobalRevenue";
import GlobalRentals from "./components/SuperAdminComponents/GlobalRentals";
import SubscriptionsManagement from "./components/SuperAdminComponents/SubscriptionsManagement";
import DealersManagement from "./components/SuperAdminComponents/DealersManagement";
import GlobalFleet from "./components/SuperAdminComponents/GlobalFleet";
import DealerFleet from "./components/AdminComponents/DealerFleet";
import LiveTracking from "./components/AdminComponents/LiveTracking";
import MaintenanceTracker from "./components/AdminComponents/MaintenanceTracker";
import DealerContracts from "./components/AdminComponents/DealerContracts";
import DealerRevenue from "./components/AdminComponents/DealerRevenue";
import CarAvailabilityCalendar from "./components/AdminComponents/CarAvailabilityonCalender";
import DealerManageBooking from "./components/AdminComponents/DealerManageBooking";
import DealershipDrivers from "./components/AdminComponents/DealershipDrivers";
import DealershipCustomers from "./components/AdminComponents/DealershipCustomers";
import DealerInvoices from "./components/AdminComponents/DealerInvoices";
import DealerEarnings from "./components/AdminComponents/DealerEarnings";
import DealerPromotions from "./components/AdminComponents/DealerPromotions";
import DealerReviews from "./components/AdminComponents/DealerReviews";
import AdminAddBooking from "./components/AdminComponents/AdminAddBooking";
import HREmployees from "./components/HRComponents/HREmployees";
import HRAttendance from "./components/HRComponents/HRAttendance";
import HRPayroll from "./components/HRComponents/HRPayroll";
import HRDocuments from "./components/HRComponents/HRDocuments";
import HRReports from "./components/HRComponents/HRReports";
import CustomerBrowse from "./components/CustomerComponents/CustomerBrowse";
import CustomerRewards from "./components/CustomerComponents/CustomerRewards";
import CustomerActiveTrip from "./components/CustomerComponents/CustomerActiveTrips";
import CustomerBilling from "./components/CustomerComponents/CustomerBillings";
import CustomerSupport from "./components/CustomerComponents/CustommerSupport";
import CustomerRentals from "./components/CustomerComponents/CustomerRentals";
import SuperAdminPayouts from "./components/SuperAdminComponents/SuperAdminPayouts";
import SuperAdminRentals from "./components/SuperAdminComponents/SupeAdminRentals";
import SuperAdminClients from "./components/SuperAdminComponents/SuperAdminClients";
import SuperAdminSupport from "./components/SuperAdminComponents/SuperAdminSupport";
import SuperAdminStaff from "./components/SuperAdminComponents/SuperAdminStaff";
import SuperAdminSystem from "./components/SuperAdminComponents/SuperAdminSystemSettings";
import SuperAdminReports from "./components/SuperAdminComponents/SuperAdminReports";
import SuperAdminAuditLogs from "./components/SuperAdminComponents/SuperAdminAuditLogs";
import SuperAdminIntegrations from "./components/SuperAdminComponents/SuperAdminIntegrations";
import SuperAdminCompliance from "./components/SuperAdminComponents/SuperAdminCompliance";
import DealerAccount from "./components/AdminComponents/DealerAccount";
import DealerSupport from "./components/AdminComponents/DealerSupport";
import CustomerFileComplaint from "./components/CustomerComponents/CustomerFileComplaint";

// Super Admin Components (Make sure paths match your folder structure)

// --- Role-Based Route Switchers ---

function DashboardSwitcher() {
  const { user } = useAuth();
  switch (user?.role) {
    case "superadmin": return <SuperAdminDashboard />;
    // case "admin":      return <AdminDashboard />;
    case "hr":         return <HRDashboard />;
    case "dealer":     return <DealerDashboard />;
    case "customer":   return <CustomerDashboard />;
    default:           return <CustomerDashboard />;
  }
}

function RentalsSwitcher() {
  const { user } = useAuth();
  // Super Admins see global rentals; Customers see their own rentals
  if (user?.role === "superadmin") return <GlobalRentals />;
  return <CustomerRentals />;
}

function FleetSwitcher() {
  const { user } = useAuth();
  // Super Admins see global fleet; Dealers see their specific fleet
  if (user?.role === "superadmin") return <GlobalFleet />;
  // Fallback to a Dealer Fleet component if you build one later:
  // return <DealerFleet />; 
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* Protected Layout Routes */}
            <Route element={<AppLayout />}>
              {/* Shared Role-Based Routes */}
              <Route path="dashboard" element={<DashboardSwitcher />} />
              <Route path="rentals" element={<RentalsSwitcher />} />
              <Route path="fleet" element={<FleetSwitcher />} />

              {/* Super Admin Exclusive Routes */}
              <Route path="superadmin-dealers" element={<DealersManagement />} />
              <Route path="superadmin-subscriptions" element={<SubscriptionsManagement />} />
              <Route path="superadmin-revenue" element={<GlobalRevenue />} />
              <Route path="superadmin-payouts" element={<SuperAdminPayouts />} />
              {/* <Route path="superadmin-marketing" element={<MarketingManagement />} /> */}
              <Route path="superadmin-support" element={<SuperAdminSupport />} />
              <Route path="superadmin-staff" element={<SuperAdminStaff />} />
              <Route path="superadmin-compliance" element={<SuperAdminCompliance />} />
              <Route path="superadmin-integrations" element={<SuperAdminIntegrations />} />
              <Route path="superadmin-audit-logs" element={<SuperAdminAuditLogs />} />
              <Route path="superadmin-reports" element={<SuperAdminReports />} />
              <Route path="superadmin-system" element={<SuperAdminSystem />} />
              <Route path="superadmin-rentals" element={<SuperAdminRentals />} />
              <Route path="superadmin-fleet" element={<GlobalFleet />} />
              <Route path="superadmin-clients" element={<SuperAdminClients />} />


              {/* Admin Exclusive Routes */}
              <Route path="maintenance" element={<MaintenanceTracker />} />
              <Route path="live-tracking" element={<LiveTracking />} />
              <Route path="dealer-fleet" element={<DealerFleet />} />
              <Route path="dealer-contracts" element={<DealerContracts />} />
              <Route path="dealer-payments" element={<DealerRevenue/>} />
              <Route path="availability" element={<CarAvailabilityCalendar />} />
              <Route path="dealer-booking" element={<DealerManageBooking />} />
              <Route path="dealer-drivers" element={<DealershipDrivers />} />
              <Route path="dealer-customers" element={<DealershipCustomers />} /> 
              <Route path="dealer-invoices" element={<DealerInvoices />} />
              <Route path="dealer-earnings" element={<DealerEarnings />} />
              <Route path="dealer-reviews" element={<DealerReviews />} />
              <Route path="dealer-promotions" element={<DealerPromotions />} />
              <Route path="admin-add-booking" element={<AdminAddBooking />} />
              <Route path="dealer-account" element={<DealerAccount />} />
              <Route path="dealer-support" element={<DealerSupport />} />


              {/* HR Exclusive Routes */}
              <Route path="hrstaff" element={<HREmployees />} />
              <Route path="hrattendance" element={<HRAttendance />} />
              <Route path="hrpayroll" element={<HRPayroll />} />
              <Route path="hrdocs" element={<HRDocuments />} />
              <Route path="hrreports" element={<HRReports />} />


              {/* Customer Exclusive Routes */}
              <Route path="customer-profile" element={<CustomerProfile />} />
              <Route path="customer-rentals" element={<CustomerRentals/>} />
              <Route path="customer-active-trip" element={<CustomerActiveTrip />} />
              <Route path="customer-browse" element={<CustomerBrowse />} />
              <Route path="customer-saved" element={<CustomerSaved />} /> 
              <Route path="customer-billing" element={<CustomerBilling />} />
              <Route path="customer-rewards" element={<CustomerRewards />} />
              <Route path="customer-support" element={<CustomerSupport />} />
              <Route path="customer-complaint" element={<CustomerFileComplaint />} />
              <Route path="preferences" element={<PreferencesSection />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}