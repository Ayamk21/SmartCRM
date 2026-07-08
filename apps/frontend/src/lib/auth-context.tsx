"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  role: "ADMIN" | "COLLABORATOR";
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (tenantName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<AuthResponse>("/auth/refresh", { method: "POST" })
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
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (tenantName: string, email: string, password: string) => {
      const data = await apiFetch<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ tenantName, email, password }),
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, signup, logout }}
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
