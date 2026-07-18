"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "COLLABORATOR";
  mustChangePassword: boolean;
}

type LoginResponse =
  | { isPlatformAdmin: true; accessToken: string }
  | { isPlatformAdmin: false; accessToken: string; user: AuthUser };

interface RefreshResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  signup: (tenantName: string, category: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  markPasswordChanged: () => void;
}

interface SignupResponse {
  user: AuthUser;
  tenant: { id: string; name: string; status: string };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<RefreshResponse>("/auth/refresh", { method: "POST" })
      .then((data) => {
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!data.isPlatformAdmin) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return data;
  }, []);

  const signup = useCallback(
    async (tenantName: string, category: string, email: string) => {
      await apiFetch<SignupResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ tenantName, category, email }),
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  const markPasswordChanged = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, signup, logout, markPasswordChanged }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit etre utilise a l'interieur de <AuthProvider>");
  }
  return ctx;
}
