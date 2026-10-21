export interface RoleMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export interface NavItem {
  icon: string;
  label: string;
  id: string;
}

export const ROLE_META: Record<string, RoleMeta> = {
  superadmin: {
    label: "Super Admin",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-500/20",
  },
  hr: {
    label: "HR Manager",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/20",
  },
  dealer: {
    label: "Car Dealer",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-500/20",
  },
  customer: {
    label: "Customer",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    border: "border-violet-200 dark:border-violet-500/20",
  },
};

const NAV_ITEMS: Record<string, NavItem[]> = {
  superadmin: [
    { icon: "LayoutDashboard", label: "Overview", id: "dashboard" },
    
    { icon: "Building2", label: "Dealers", id: "superadmin-dealers" },
    { icon: "CreditCard", label: "Subscriptions", id: "superadmin-subscriptions" }, 
    
    { icon: "Car", label: "Global Fleet", id: "superadmin-fleet" },
    { icon: "ClipboardList", label: "All Rentals", id: "superadmin-rentals" },
    { icon: "Users", label: "All Clients", id: "superadmin-clients" },
    
    { icon: "DollarSign", label: "Global Revenue", id: "superadmin-revenue" },
    { icon: "Wallet", label: "Platform Payouts", id: "superadmin-payouts" }, 
    
    { icon: "UserCog", label: "Platform Staff", id: "superadmin-staff" },
    
    
    { icon: "Megaphone", label: "Marketing", id: "superadmin-marketing" }, 
    { icon: "LifeBuoy", label: "Support Tickets", id: "superadmin-support" },
    
    
    { icon: "FileCheck", label: "Compliance", id: "superadmin-compliance" },
    { icon: "Plug", label: "Integrations", id: "superadmin-integrations" }, 
    { icon: "ShieldAlert", label: "Audit Logs", id: "superadmin-audit-logs" }, 
    { icon: "BarChart2", label: "Reports", id: "superadmin-reports" },
    { icon: "Settings", label: "System Settings", id: "superadmin-system" },
  ],
 
  hr: [
    { icon: "LayoutDashboard", label: "Dashboard", id: "dashboard" },
    { icon: "UserCog", label: "Employees", id: "hrstaff" },
    { icon: "CalendarDays", label: "Attendance", id: "hrattendance" },
    { icon: "Banknote", label: "Payroll", id: "hrpayroll" },
    { icon: "FolderOpen", label: "Documents", id: "hrdocs" },
    { icon: "BarChart2", label: "HR Reports", id: "hrreports" },
  ],
  dealer: [
    // Core Overview
    { icon: "LayoutDashboard", label: "Dashboard", id: "dashboard" },
    
    // Inventory & Asset Management
    { icon: "Car", label: "My Fleet", id: "dealer-fleet" },
    { icon: "Wrench", label: "Maintenance", id: "maintenance" }, // Track service history, oil changes, & repairs 
    { icon: "Map", label: "Live Tracking", id: "live-tracking" }, // Real-time GPS location of active rentals 
    
    // Sales & 
    {icon: "Plus", label: "Add New Booking", id: "admin-add-booking" }, // View and manage current and past rentals
    { icon: "ClipboardList", label: "Bookings", id: "dealer-booking" },
    { icon: "Credit", label: "Payments", id: "dealer-payments" }, // View transactions, issue refunds, and manage payment methods
    { icon: "CalendarDays", label: "Availability", id: "availability" }, // Manage vehicle availability calendar
    { icon: "FileSignature", label: "Contracts", id: "dealer-contracts" }, // Manage digital hire agreements and e-signatures 
    { icon: "Users", label: "My Customers", id: "dealer-customers" },
    
    // Workforce Management
    { icon: "UserCheck", label: "Drivers", id: "dealer-drivers" }, // Manage assigned drivers for the fleet [cite: 581]
    { icon: "UsersRound", label: "Staff & HR", id: "dealer-staff" }, // Dealer-specific staff and payroll (PAYE/NHIF/NSSF) bado
    
    // Financials & Compliance
    { icon: "DollarSign", label: "Earnings", id: "dealer-earnings" },
    { icon: "Receipt", label: "Invoices", id: "dealer-invoices" }, // KRA-compliant invoicing and tax tracking 
    
    // Reputation & Growth
    { icon: "Star", label: "Reviews", id: "dealer-reviews" },
    { icon: "TicketPercent", label: "Promotions", id: "dealer-promotions" }, // Create dealer-specific discount codes
    
    // Support & Configuration
    { icon: "LifeBuoy", label: "Help Center", id: "support" },
    { icon: "Settings", label: "Profile", id: "settings" },
    {icon: "UserCog", label: "Account Settings", id: "account-settings" }, // Business info, payment details, and communication preferences
  ],


 customer: [
    // Core Experience
    { icon: "LayoutDashboard", label: "Dashboard", id: "dashboard" },
    { icon: "Search", label: "Browse Vehicles", id: "customer-browse" }, // To discover and book new cars
    
    // Trip Management
    { icon: "Key", label: "My Rentals", id: "customer-rentals" }, // Active, upcoming, and past trips
    { icon: "Map", label: "Live Trip", id: "customer-active-trip" }, // Track current rental, extension options, etc.
    
    // Engagement & Billing
    { icon: "Heart", label: "Saved Vehicles", id: "customer-saved" }, // Wishlist or frequent rentals
    { icon: "CreditCard", label: "Billing & Payments", id: "customer-billing" }, // Invoices, M-PESA receipts, and payment methods
    { icon: "Award", label: "Loyalty & Rewards", id: "customer-rewards" }, // View points, tiers, and available discounts
    {icon: "UserCog", label: "File Complaint", id: "customer-complaint" }, // Communication preferences, saved drivers, etc.
    
    // Account & Support
    { icon: "LifeBuoy", label: "Help & Support", id: "customer-support" }, // Roadside assistance, FAQs, contact dealer
    { icon: "Settings", label: "Profile Settings", id: "customer-profile" }, // Personal info, license uploads, preferences

  ],
};

export default NAV_ITEMS;