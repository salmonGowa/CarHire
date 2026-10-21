// Platform operations: compliance documents, support tickets, dealer subscriptions.

export type DocumentState = "requested" | "overdue" | "pending_review" | "verified" | "expiring" | "expired" | "rejected" | "superseded";

export interface DealerDocument {
  id: number;
  reference: string;
  dealer: { id: number; name: string };
  type: string;
  required: boolean;
  state: DocumentState;
  due_on: string | null;
  expires_on: string | null;
  notes: string | null;
  review_note: string | null;
  has_file: boolean;
  original_name: string | null;
  size: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer: string | null;
  updated_at: string;
}

export interface MissingDocument {
  type: string;
  open: boolean;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface SupportTicket {
  id: number;
  reference: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  origin: "customer" | "dealer" | "staff";
  reporter: { id: number; name: string; email: string };
  dealer: string | null;
  booking: { id: number; reference: string } | null;
  assignee: { id: number; name: string } | null;
  messages_count: number | null;
  created_at: string;
  last_activity_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
}

export interface SupportMessage {
  id: number;
  body: string;
  internal: boolean;
  author: string;
  from_support: boolean;
  mine: boolean;
  at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

export interface TicketList {
  data: SupportTicket[];
  summary: { active: number; urgent_high: number; unassigned: number; resolved_7_days: number; avg_first_response_hours: number | null };
  categories: string[];
  agents: { id: number; name: string }[];
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  monthly_fee: number;
  vehicle_limit: number | null;
  staff_limit: number | null;
  description: string | null;
  dealers: number | null;
}

export interface SubscriptionCharge {
  id: number;
  reference: string;
  dealer: { id: number; name: string };
  plan: string;
  amount: number;
  period: string;
  due_on: string;
  status: "pending" | "overdue" | "paid" | "void";
  method: string | null;
  transaction_ref: string | null;
  paid_at: string | null;
}
