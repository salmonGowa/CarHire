// Shapes returned by the Laravel API resources (app/Http/Resources).

export type VehicleStatus = "available" | "rented" | "maintenance";
export type BookingStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled";
export type PaymentMethod = "mpesa" | "card" | "cash" | "pay_later";
/** Methods money is actually received by (pay_later is only a booking preference). */
export type ReceivedMethod = "mpesa" | "card" | "bank" | "cash";
export type InvoiceStatus = "unpaid" | "partial" | "paid" | "void";

export interface DealerSummary {
  id: number;
  name: string;
  city: string;
}

export interface Vehicle {
  id: number;
  model: string;
  plate: string;
  type: string;
  year: number | null;
  seats: number;
  transmission: "auto" | "manual";
  fuel_type: "petrol" | "diesel" | "hybrid" | "electric";
  daily_rate: number;
  mileage: number;
  fuel_level: number;
  status: VehicleStatus;
  location: string | null;
  image_url: string | null;
  dealer?: DealerSummary;
  is_saved?: boolean;
  rating?: number | null;
}

export interface Booking {
  id: number;
  reference: string;
  status: BookingStatus;
  is_overdue: boolean;
  customer: { id: number | null; name: string; email: string | null; phone: string | null; id_number: string | null };
  vehicle?: Pick<Vehicle, "id" | "model" | "plate" | "type" | "image_url">;
  dealer?: DealerSummary;
  pickup_at: string;
  return_at: string;
  pickup_location: string;
  days: number;
  daily_rate: number;
  subtotal: number;
  vat: number;
  total: number;
  payment_method: PaymentMethod | null;
  rating: number | null;
  created_at: string;
  allowed_transitions: BookingStatus[];
  can_rate: boolean;
  invoice?: { id: number; number: string; status: InvoiceStatus; amount_paid: number; balance: number } | null;
  can_record_payment: boolean;
  review: string | null;
  review_reply: string | null;
  discount: number;
  agreement_type: "self_drive" | "chauffeur";
  agreement_signed: boolean;
}

export interface Payment {
  id: number;
  reference: string;
  amount: number;
  method: ReceivedMethod;
  transaction_code: string | null;
  status: "completed" | "refunded";
  paid_at: string;
  refunded_at: string | null;
  vat?: number;
  commission?: number;
  dealer_net?: number;
  settled?: boolean;
  booking?: { id: number; reference: string; customer_name: string; vehicle: string | null };
  invoice_number?: string;
  dealer?: DealerSummary;
  can_refund: boolean;
}

export interface Invoice {
  id: number;
  number: string;
  status: InvoiceStatus;
  issued_at: string;
  customer_name: string;
  subtotal: number;
  vat: number;
  total: number;
  amount_paid: number;
  balance: number;
  booking?: {
    id: number;
    reference: string;
    status: BookingStatus;
    days: number;
    daily_rate: number;
    pickup_at: string;
    return_at: string;
    customer_phone: string | null;
    customer_email: string | null;
    vehicle: { model: string; plate: string } | null;
  };
  dealer?: { id: number; name: string; city: string; address: string | null; phone: string | null; email: string | null; tax_pin: string | null };
  payments?: Payment[];
  can_record_payment: boolean;
}

export interface Payout {
  id: number;
  reference: string;
  dealer?: DealerSummary;
  period_start: string;
  period_end: string;
  payment_count: number;
  gross_collected: number;
  cash_collected: number;
  commission: number;
  net: number;
  status: "pending" | "paid";
  paid_at: string | null;
  transfer_reference: string | null;
  created_at: string;
}

interface MoneyTotals {
  gross: number;
  vat: number;
  commission: number;
  net: number;
  count: number;
}

export interface FinanceSummary {
  commission_rate: number;
  vat_rate: number;
  month_to_date: MoneyTotals;
  previous_month: MoneyTotals;
  monthly: (MoneyTotals & { month: string; label: string })[];
  last_7_days: { date: string; label: string; gross: number }[];
  outstanding: number;
  payouts: { pending_count: number; pending_net: number; unsettled_net: number; last_paid_at: string | null; last_paid_net: number | null };
}

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface Stats {
  bookings: {
    pending: number;
    confirmed: number;
    active: number;
    overdue: number;
    completed: number;
    completed_today: number;
    cancelled_today: number;
    upcoming_pickups: number;
    next_pickup_at: string | null;
  };
  revenue: { booked_today: number; month_to_date: number; active_value: number };
  vehicles?: { total: number; available: number; rented: number; maintenance: number };
  platform?: { dealers: number; customers: number };
  trips?: { completed: number; total_spent: number; days: number; average_rating: number };
}

// --- Dealer operations ---------------------------------------------------

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed";
export type Priority = "low" | "medium" | "high";

export interface MaintenanceTask {
  id: number;
  reference: string;
  vehicle: { id: number; model: string; plate: string; status: VehicleStatus } | null;
  service: string;
  due_date: string;
  is_overdue: boolean;
  priority: Priority;
  status: MaintenanceStatus;
  cost: number | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  allowed_transitions: MaintenanceStatus[];
}

export interface MaintenanceList {
  data: MaintenanceTask[];
  summary: { critical_open: number; due_next_7_days: number; overdue: number; completed_this_month: number; cost_this_month: number };
}

export interface Driver {
  id: number;
  reference: string;
  name: string;
  phone: string;
  license_class: string;
  license_number: string | null;
  license_expires_on: string | null;
  license_expired: boolean;
  is_active: boolean;
  joined_on: string | null;
  photo_url: string | null;
  license_image_url: string | null;
  completed_trips: number;
  average_rating: number | null;
  current_assignment: { booking_reference: string; vehicle: string | null; customer_name: string; return_at: string } | null;
}

export interface DriverDetail extends Driver {
  trips: { id: number; reference: string; status: BookingStatus; customer_name: string; vehicle: string | null; pickup_location: string; pickup_at: string; return_at: string; rating: number | null }[];
}

export interface DealerCustomer {
  key: string;
  has_account: boolean;
  name: string;
  email: string | null;
  phone: string | null;
  trips: number;
  completed_trips: number;
  cancellations: number;
  total_spent: number;
  outstanding: number;
  average_rating_given: number | null;
  first_booking_at: string;
  last_booking_at: string;
  last_vehicle: string | null;
  bookings: { id: number; reference: string; status: BookingStatus; vehicle: string | null; pickup_at: string; total: number }[];
}

export interface Review {
  booking_id: number;
  booking_reference: string;
  customer_name: string;
  rating: number;
  review: string | null;
  rated_at: string;
  vehicle: string | null;
  reply: string | null;
  replied_at: string | null;
}

export type PromotionStatus = "active" | "paused" | "expired" | "used_up";

export interface Promotion {
  id: number;
  code: string;
  type: "percentage" | "flat";
  value: number;
  max_uses: number | null;
  used: number;
  expires_on: string;
  is_active: boolean;
  status: PromotionStatus;
}

export type AgreementStatus = "pending_signature" | "signed" | "closed" | "unsigned" | "void";

export interface Agreement {
  booking_id: number;
  reference: string;
  booking_reference: string;
  status: AgreementStatus;
  booking_status: BookingStatus;
  agreement_type: "self_drive" | "chauffeur";
  signed_at: string | null;
  customer: { name: string; phone: string | null; email: string | null; id_number: string | null };
  vehicle: { model: string; plate: string } | null;
  driver: { id: number; name: string; phone: string; license_class: string } | null;
  dealer: { name: string; city: string; address: string | null; phone: string | null } | null;
  pickup_at: string;
  return_at: string;
  pickup_location: string;
  days: number;
  total: number;
  editable: boolean;
}

// --- Platform administration ---------------------------------------------

export interface AdminDealer {
  id: number;
  reference: string;
  name: string;
  city: string;
  county: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: "active" | "suspended" | "pending";
  tier: "silver" | "gold" | "platinum";
  license_no: string | null;
  tax_pin: string | null;
  notes: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  owner_national_id: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  manager_email: string | null;
  joined: string;
  vehicle_count: number;
  staff_count: number;
  active_rentals: number;
  revenue_this_month: number;
}

export interface AccountSummary {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  role: string;
  status: "active" | "suspended";
  joined: string;
  last_login_at: string | null;
}

export interface AdminDealerDetail extends AdminDealer {
  fleet_breakdown: { type: string; count: number; rented: number }[];
  staff: AccountSummary[];
  completed_bookings: number;
}

export interface AdminClient {
  id: number;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  alt_phone: string | null;
  national_id: string | null;
  kra_pin: string | null;
  gender: string | null;
  address: string | null;
  county: string | null;
  admin_notes: string | null;
  date_of_birth: string | null;
  joined: string;
  last_login_at: string | null;
  status: "Active" | "Suspended" | "Flagged";
  flagged: boolean;
  kyc: "Verified" | "Pending" | "Rejected";
  kyc_reviewed_at: string | null;
  kyc_reviewer: string | null;
  kyc_note: string | null;
  ltv: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  bookings_count: number;
  completed_trips: number;
  completion_rate: number | null;
}

export interface AdminClientDetail extends AdminClient {
  bookings: { id: number; reference: string; status: BookingStatus; vehicle: string | null; dealer: string | null; pickup_at: string; total: number }[];
  payments: { id: number; reference: string; amount: number; method: string; status: string; paid_at: string; booking_reference: string | null }[];
  activity: { action: string; by: string; at: string }[];
}

export interface AuditEntry {
  id: number;
  reference: string;
  at: string;
  actor: string;
  action: string;
  description: string;
  severity: "info" | "warning" | "critical";
  ip_address: string | null;
}
