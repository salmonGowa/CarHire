import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { appConfig } from "@/lib/appConfig";

export type UserRole = "superadmin" | "admin" | "hr" | "dealer" | "customer";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: "customer" | "dealer";
  password: string;
  password_confirmation: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
}


const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(appConfig.user);
  const [loading, setLoading] = useState(false);

  const run = async (request: () => Promise<{ user: User | null }>) => {
    setLoading(true);
    try {
      const { user } = await request();
      setUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, remember = false) =>
    (await run(() => api("/api/auth/login", { method: "POST", body: { email, password, remember } })))!;

  const register = async (input: RegisterInput) =>
    (await run(() => api("/api/auth/register", { method: "POST", body: input })))!;

  const logout = async () => {
    await run(() => api("/api/auth/logout", { method: "POST" }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
