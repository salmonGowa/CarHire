// Shapes returned by app/Http/Controllers/Api/Hr.

export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";
export type EmployeeStatus = "active" | "on_leave" | "left";

export interface Employee {
  id: number;
  number: string;
  name: string;
  email: string;
  phone: string | null;
  job_title: string;
  department: string;
  employment_type: EmploymentType;
  basic_salary: number;
  hired_on: string;
  terminated_on: string | null;
  kra_pin: string | null;
  nssf_number: string | null;
  shif_number: string | null;
  status: EmployeeStatus;
}

export type AttendanceStatus = "on_time" | "late" | "not_in" | "on_leave";

export interface AttendanceRow {
  employee_id: number;
  number: string;
  name: string;
  job_title: string;
  clock_in: string | null;
  clock_out: string | null;
  status: AttendanceStatus;
  leave_type: string | null;
  notes: string | null;
}

export interface AttendanceDay {
  date: string;
  is_weekend: boolean;
  data: AttendanceRow[];
  summary: { headcount: number; present: number; late: number; on_leave: number; pending_leave: number };
}

export type LeaveType = "annual" | "sick" | "maternity" | "paternity" | "compassionate" | "unpaid";

export interface LeaveRequest {
  id: number;
  reference: string;
  employee: { id: number; name: string; job_title: string };
  type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  decided_at: string | null;
  annual_remaining: number | null;
}

export type PayrollStatus = "draft" | "approved" | "paid";

export interface PayrollRun {
  id: number;
  period: string;
  label: string;
  status: PayrollStatus;
  employees: number;
  gross: number;
  net: number;
  paye: number;
  nssf: number;
  shif: number;
  housing_levy: number;
  approved_at: string | null;
  paid_at: string | null;
}

export interface Payslip {
  id: number;
  employee_id: number;
  employee_name: string;
  job_title: string;
  gross: number;
  nssf: number;
  shif: number;
  housing_levy: number;
  taxable_pay: number;
  paye: number;
  net: number;
  employer_nssf: number;
  employer_housing_levy: number;
}

export interface PayslipDetail extends Payslip {
  period: string;
  run_status: PayrollStatus;
  employee: { number: string; department: string; kra_pin: string | null; nssf_number: string | null; shif_number: string | null };
}

export interface EmployeeDocument {
  id: number;
  employee: { id: number; name: string };
  type: string;
  original_name: string;
  format: string;
  size: number;
  uploaded_at: string;
  expires_on: string | null;
  expiring: boolean;
  status: "pending" | "verified" | "rejected";
}

export interface HrSummary {
  headcount: number;
  present_today: number;
  on_leave_today: number;
  pending_leave: number;
  new_this_month: number;
  attrition_ytd_percent: number;
  documents: { pending: number; expiring: number };
  headcount_trend: { month: string; label: string; count: number }[];
  departments: { department: string; count: number; percent: number }[];
  payroll_history: { period: string; label: string; gross: number; net: number; status: PayrollStatus }[];
  latest_payroll: (Omit<PayrollRun, "approved_at" | "paid_at">) | null;
}

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  intern: "Intern",
};

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  compassionate: "Compassionate Leave",
  unpaid: "Unpaid Leave",
};

export const PAYROLL_STATUS_STYLE: Record<PayrollStatus, string> = {
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
};
