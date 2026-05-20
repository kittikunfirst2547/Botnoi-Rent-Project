"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "javis_auth_token";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string;
  loading: boolean;
  authModalOpen: boolean;
  authMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function authRequest(path: string, body?: unknown, token?: string) {
  const response = await fetch(`${API_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_KEY) ?? "";
    if (!savedToken) {
      setLoading(false);
      return;
    }

    authRequest("/api/auth/me", undefined, savedToken)
      .then((data) => {
        setToken(savedToken);
        setUser(data.user);
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const persistSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setAuthModalOpen(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authRequest("/api/auth/login", { email, password });
    persistSession(data.token, data.user);
  }, [persistSession]);

  const register = useCallback(async (payload: { name: string; email: string; phone: string; password: string }) => {
    const data = await authRequest("/api/auth/register", payload);
    persistSession(data.token, data.user);
  }, [persistSession]);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  }, []);

  const openAuthModal = useCallback((mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    loading,
    authModalOpen,
    authMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
  }), [authModalOpen, authMode, closeAuthModal, loading, login, logout, openAuthModal, register, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
