import type { User } from "@/components/AuthContext";

export interface AppConfig {
  user: User | null;
  showDemoAccounts: boolean;
}

// Laravel renders the signed-in user into the page, so the first render
// already knows who is logged in (no flash of the login screen on refresh).
function readAppConfig(): AppConfig {
  try {
    const el = document.getElementById("app-config");
    return el?.textContent ? (JSON.parse(el.textContent) as AppConfig) : { user: null, showDemoAccounts: false };
  } catch {
    return { user: null, showDemoAccounts: false };
  }
}

export const appConfig = readAppConfig();
