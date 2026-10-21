import type { User } from "@/components/AuthContext";

/** Public platform settings (System Settings), fixed for the page's lifetime. */
export interface PlatformConfig {
  maintenance_mode: boolean;
  maintenance_message: string;
  customer_registration: boolean;
  dealer_registration: boolean;
  support_email: string | null;
  support_phone: string | null;
  min_booking_hours: number;
  max_booking_days: number;
  free_cancellation_hours: number;
  min_driver_age: number;
}

export interface AppConfig {
  user: User | null;
  showDemoAccounts: boolean;
  platform: PlatformConfig;
}

const DEFAULT_PLATFORM: PlatformConfig = {
  maintenance_mode: false, maintenance_message: "", customer_registration: true, dealer_registration: true,
  support_email: null, support_phone: null, min_booking_hours: 4, max_booking_days: 30, free_cancellation_hours: 24, min_driver_age: 21,
};

// Laravel renders the signed-in user into the page, so the first render
// already knows who is logged in (no flash of the login screen on refresh).
function readAppConfig(): AppConfig {
  try {
    const el = document.getElementById("app-config");
    const parsed = el?.textContent ? (JSON.parse(el.textContent) as Partial<AppConfig>) : {};
    return { user: parsed.user ?? null, showDemoAccounts: parsed.showDemoAccounts ?? false, platform: { ...DEFAULT_PLATFORM, ...parsed.platform } };
  } catch {
    return { user: null, showDemoAccounts: false, platform: DEFAULT_PLATFORM };
  }
}

export const appConfig = readAppConfig();
