// The signed-in user's own account, notifications, rewards and current trip.
import type { Booking } from "./models";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  tone: "success" | "info" | "warning" | "error";
  read: boolean;
  at: string;
}

export interface Preferences {
  preferred_vehicle_types: string[];
  default_pickup_location: string | null;
  mpesa_phone: string | null;
  email_bookings: boolean;
  email_receipts: boolean;
  sms_reminders: boolean;
  marketing: boolean;
}

export interface ProfileDocument {
  id: number;
  type: string;
  label: string;
  original_name: string;
  size: number;
  uploaded_at: string;
}

export interface Profile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  alt_phone: string | null;
  gender: string | null;
  address: string | null;
  county: string | null;
  national_id: string | null;
  kra_pin: string | null;
  licence_number: string | null;
  date_of_birth: string | null;
  licence_expires_on: string | null;
  licence_expired: boolean;
  joined: string;
  kyc: { status: "pending" | "verified" | "rejected"; note: string | null; reviewed_at: string | null };
  documents: ProfileDocument[];
  document_types: Record<string, string>;
  preferences: Preferences;
  vehicle_types: string[];
}

export interface Rewards {
  points: number;
  lifetime_value: number;
  tier: string;
  next_tier: { name: string; threshold: number } | null;
  tiers: { name: string; threshold: number }[];
  completed_trips: number;
  reviews: number;
  unrated: number;
  history: { at: string; label: string; points: number }[];
  rules: { ksh_per_point: number; points_per_review: number };
}

export interface CurrentTrip {
  data: {
    booking: Booking;
    dealer: { name: string; city: string | null; county: string | null; address: string | null; phone: string | null; email: string | null } | null;
    vehicle: { model: string; plate: string; type: string; seats: number; transmission: string; fuel_type: string; image_url: string | null; year: number | null } | null;
  } | null;
  upcoming: number;
}
