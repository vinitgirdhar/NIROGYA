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
    | "government_body"
    | "community_user";
  avatar?: string;
  organization?: string;
  location?: string;
  phone?: string;
  district?: string;
  village?: string;
  specialization?: string;
  address?: string;
  bio?: string;
  bloodGroup?: string;
  occupation?: string;
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

interface RegisterResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean | RegisterResult>;
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
  const register = async (data: RegisterData): Promise<boolean | { success: boolean; error: string }> => {
    setLoading(true);
    try {
      // Ensure all required fields are present and clean
      if (!data.name || !data.email || !data.password) {
        message.error("Please fill in all required fields");
        return { success: false, error: "Please fill in all required fields" };
      }

      const body = {
        full_name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role || "community_user",
        password: data.password,
        confirm_password: data.confirmPassword || data.password,
        organization: data.organization?.trim() || undefined,
        location: data.location?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
      };

      console.log("Register request body:", JSON.stringify(body, null, 2));

      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("Register response status:", res.status);

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        console.error("Register error response:", e);
        
        // Extract error message
        let errorMessage = "Registration failed. Please try again.";
        
        // Handle validation errors
        if (e.detail && Array.isArray(e.detail)) {
          errorMessage = e.detail.map((err: any) => 
            `${err.loc?.join('.') || 'field'}: ${err.msg}`
          ).join(', ');
        } else if (e.detail) {
          errorMessage = e.detail;
        }
        
        // Return error object for field-level display
        return { success: false, error: errorMessage };
      }

      // Registration successful - parse response
      const userData = await res.json();
      console.log("Registration successful, user data:", userData);
      
      message.success("Account created successfully!");
      
      // Auto-login with the credentials
      const loginSuccess = await login(data.email.trim(), data.password);
      
      if (!loginSuccess) {
        message.warning("Account created but auto-login failed. Please login manually.");
      }
      
      return true;
    } catch (err) {
      console.error("Registration error:", err);
      return { success: false, error: "Registration failed. Please check your connection and try again." };
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
