// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { message } from "antd";

/* ---------------------------------------------------------
   USER INTERFACES
--------------------------------------------------------- */
interface User {
  id: string;
  email: string;
  name: string;
  role:
    | "admin"
    | "asha_worker"
    | "volunteer"
    | "healthcare_worker"
    | "district_health_official"
    | "government_body"
    | "community_user";
  avatar?: string;
  organization?: string;
  location?: string;
  phone?: string;
  district?: string;
  village?: string;
  specialization?: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: User["role"];
  organization?: string;
  location?: string;
  phone?: string;
  district?: string;
  village?: string;
  specialization?: string;
  confirmPassword?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  authHeaders: () => Record<string, string>;
  fetchProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

/* ---------------------------------------------------------
   AUTH PROVIDER
--------------------------------------------------------- */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("paanicare-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setLoading] = useState(false);

  /* ---------------------------------------------------------
     FIXED: ALWAYS RETURNS VALID HEADERS
  --------------------------------------------------------- */
  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("paanicare-token");

    if (token) {
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    }

    return {
      "Content-Type": "application/json",
    };
  };

  /* ---------------------------------------------------------
     MAP BACKEND USER → CLIENT USER
  --------------------------------------------------------- */
  const mapUser = (b: any): User => ({
    id: b.id || b._id || String(Date.now()),
    email: b.email,
    name: b.full_name || b.name || b.email.split("@")[0],
    role: b.role || "community_user",
    organization: b.organization,
    location: b.location,
    phone: b.phone,
  });

  /* ---------------------------------------------------------
     FETCH PROFILE FROM BACKEND
  --------------------------------------------------------- */
  const fetchProfile = async (): Promise<User | null> => {
    const token = localStorage.getItem("paanicare-token");
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: authHeaders(),
      });

      if (!res.ok) return null;

      const backend = await res.json();
      const mapped = mapUser(backend);

      setUser(mapped);
      localStorage.setItem("paanicare-user", JSON.stringify(mapped));
      return mapped;
    } catch {
      return null;
    }
  };

  /* ---------------------------------------------------------
     FIXED: SAFE useEffect + ESLINT IGNORE
  --------------------------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("paanicare-token");
    const stored = localStorage.getItem("paanicare-user");

    if (token && stored) {
      setUser(JSON.parse(stored));
      return;
    }

    if (token && !stored) fetchProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------
     LOGIN
  --------------------------------------------------------- */
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        message.error(err.detail || "Login failed");
        return false;
      }

      const data = await res.json();
      const token = data.access_token;

      if (!token) {
        message.error("No token returned");
        return false;
      }

      localStorage.setItem("paanicare-token", token);

      // If login response includes user → use it
      let u: User | null = data.user ? mapUser(data.user) : await fetchProfile();

      if (!u) {
        u = {
          id: Date.now().toString(),
          email,
          name: email.split("@")[0],
          role: "community_user",
        };
      }

      setUser(u);
      localStorage.setItem("paanicare-user", JSON.stringify(u));

      message.success("Logged in");
      return true;
    } catch (err) {
      console.error(err);
      message.error("Login error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     REGISTER
  --------------------------------------------------------- */
  const register = async (data: RegisterData): Promise<boolean> => {
    setLoading(true);
    try {
      const body = {
        full_name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
        confirm_password: data.confirmPassword ?? data.password,
        organization: data.organization ?? null,
        location: data.location ?? null,
        phone: data.phone ?? null,
      };

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        message.error(e.detail || "Registration failed");
        return false;
      }

      // Auto-login
      await login(data.email, data.password);
      return true;
    } catch (err) {
      console.error(err);
      message.error("Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     LOGOUT
  --------------------------------------------------------- */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("paanicare-user");
    localStorage.removeItem("paanicare-token");
    message.success("Logged out");
  };

  /* ---------------------------------------------------------
     UPDATE PROFILE (LOCAL ONLY)
  --------------------------------------------------------- */
  const updateProfile = async (d: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    const updated = { ...user, ...d };
    setUser(updated);
    localStorage.setItem("paanicare-user", JSON.stringify(updated));

    message.success("Profile updated");
    return true;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    authHeaders,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
