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

/* ---------------------------------------------------------
   MOCK USERS DATABASE (FRONTEND-ONLY)
--------------------------------------------------------- */
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@paanicare.com",
    password: "admin123",
    name: "System Administrator",
    role: "admin" as const,
    organization: "Nirogya Platform",
    location: "Mumbai",
    phone: "+91 9876543210"
  },
  {
    id: "2",
    email: "asha@paanicare.com",
    password: "asha123",
    name: "ASHA Worker",
    role: "asha_worker" as const,
    organization: "Community Health Center",
    location: "Delhi",
    village: "Mehrauli"
  },
  {
    id: "3",
    email: "volunteer@paanicare.com",
    password: "volunteer123",
    name: "Community Volunteer",
    role: "volunteer" as const,
    organization: "Volunteer Network",
    location: "Bangalore"
  },
  {
    id: "4",
    email: "healthcare@paanicare.com",
    password: "healthcare123",
    name: "Dr. Priya Sharma",
    role: "healthcare_worker" as const,
    organization: "District Hospital",
    location: "Pune",
    specialization: "General Medicine"
  },
  {
    id: "5",
    email: "district@paanicare.com",
    password: "district123",
    name: "District Health Official",
    role: "district_health_official" as const,
    organization: "District Health Office",
    district: "Mumbai District",
    location: "Mumbai"
  },
  {
    id: "6",
    email: "government@paanicare.com",
    password: "government123",
    name: "Government Official",
    role: "government_body" as const,
    organization: "State Health Department",
    location: "Mumbai"
  },
  {
    id: "7",
    email: "user@paanicare.com",
    password: "user123",
    name: "Community User",
    role: "community_user" as const,
    organization: "Community Member",
    location: "Mumbai"
  }
];

/* ---------------------------------------------------------
   MOCK REGISTERED USERS STORAGE KEY
--------------------------------------------------------- */
const REGISTERED_USERS_KEY = "paanicare-registered-users";

/* ---------------------------------------------------------
   HELPER: GET ALL USERS (MOCK + REGISTERED)
--------------------------------------------------------- */
const getAllUsers = () => {
  try {
    const registered = localStorage.getItem(REGISTERED_USERS_KEY);
    const registeredUsers = registered ? JSON.parse(registered) : [];
    return [...MOCK_USERS, ...registeredUsers];
  } catch {
    return MOCK_USERS;
  }
};

/* ---------------------------------------------------------
   HELPER: SAVE REGISTERED USER
--------------------------------------------------------- */
const saveRegisteredUser = (user: any) => {
  try {
    const registered = localStorage.getItem(REGISTERED_USERS_KEY);
    const registeredUsers = registered ? JSON.parse(registered) : [];
    registeredUsers.push(user);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
  } catch (error) {
    console.error("Error saving registered user:", error);
  }
};

/* ---------------------------------------------------------
   HELPER: SIMULATE API DELAY
--------------------------------------------------------- */
const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

/* ---------------------------------------------------------
   AUTH PROVIDER
--------------------------------------------------------- */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("paanicare-user");
      if (saved) {
        console.log("✅ Restored user from localStorage");
        return JSON.parse(saved);
      }
      return null;
    } catch (error) {
      console.error("❌ Error restoring user:", error);
      return null;
    }
  });

  const [isLoading, setLoading] = useState(false);

  /* ---------------------------------------------------------
     AUTH HEADERS (FOR CONSISTENCY)
  --------------------------------------------------------- */
  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("paanicare-token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    };
  };

  /* ---------------------------------------------------------
     FETCH PROFILE (MOCK)
  --------------------------------------------------------- */
  const fetchProfile = async (): Promise<User | null> => {
    const token = localStorage.getItem("paanicare-token");
    if (!token) return null;

    try {
      const saved = localStorage.getItem("paanicare-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  /* ---------------------------------------------------------
     LOGIN (WITH REAL BACKEND API)
  --------------------------------------------------------- */
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("=== LOGIN WITH BACKEND API ===");
    console.log("📧 Email:", email);
    
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        message.error("Please enter both email and password");
        return false;
      }

      // Call real backend API
      console.log("📡 Sending login request to:", `${API_BASE}/api/auth/login`);
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Login failed:", errorData);
        message.error(errorData.detail || "Invalid email or password");
        return false;
      }

      const data = await response.json();
      console.log("✅ Login response:", data);

      // Extract token and user from response
      const token = data.access_token;
      const userFromApi = data.user;

      if (!token || !userFromApi) {
        console.error("❌ Invalid response format");
        message.error("Login failed. Please try again.");
        return false;
      }

      // Create user object matching our User interface
      const authenticatedUser: User = {
        id: userFromApi.id,
        email: userFromApi.email,
        name: userFromApi.full_name || userFromApi.email.split('@')[0],
        role: userFromApi.role,
        organization: userFromApi.organization,
        location: userFromApi.location,
        phone: userFromApi.phone,
        district: userFromApi.district,
      };

      // Save to localStorage
      localStorage.setItem("paanicare-token", token);
      localStorage.setItem("paanicare-user", JSON.stringify(authenticatedUser));
      
      // Update state
      setUser(authenticatedUser);

      console.log("✅ Login successful:", authenticatedUser);
      message.success(`Welcome back, ${authenticatedUser.name}!`);
      return true;

    } catch (error) {
      console.error("❌ Login error:", error);
      message.error("Login failed. Please check your connection and try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     REGISTER (WITH REAL BACKEND API)
  --------------------------------------------------------- */
  const register = async (data: RegisterData): Promise<boolean> => {
    console.log("=== REGISTER WITH BACKEND API ===");
    setLoading(true);

    try {
      // Validate required fields
      if (!data.name || !data.email || !data.password) {
        message.error("Please fill in all required fields");
        return false;
      }

      // Validate password match
      if (data.confirmPassword && data.password !== data.confirmPassword) {
        message.error("Passwords do not match");
        return false;
      }

      // Call real backend API
      console.log("📡 Sending register request to:", `${API_BASE}/api/auth/register`);
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          confirm_password: data.confirmPassword || data.password,
          role: data.role || "community_user",
          organization: data.organization?.trim(),
          location: data.location?.trim(),
          phone: data.phone?.trim(),
          district: data.district?.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Registration failed:", errorData);
        message.error(errorData.detail || "Registration failed. Please try again.");
        return false;
      }

      const userData = await response.json();
      console.log("✅ Registration response:", userData);

      message.success("Account created successfully!");

      // Auto-login
      const loginSuccess = await login(data.email.trim(), data.password);
      
      if (!loginSuccess) {
        message.warning("Account created but auto-login failed. Please login manually.");
      }

      return true;

    } catch (error) {
      console.error("❌ Registration error:", error);
      message.error("Registration failed. Please check your connection and try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     LOGOUT
  --------------------------------------------------------- */
  const logout = () => {
    console.log("🚪 Logging out user");
    setUser(null);
    localStorage.removeItem("paanicare-user");
    localStorage.removeItem("paanicare-token");
    message.success("Logged out successfully");
  };

  /* ---------------------------------------------------------
     UPDATE PROFILE
  --------------------------------------------------------- */
  const updateProfile = async (d: Partial<User>): Promise<boolean> => {
    if (!user) {
      console.error("❌ Cannot update profile: No user logged in");
      return false;
    }

    // Simulate delay
    await simulateDelay(500);

    const updated = { ...user, ...d };
    setUser(updated);
    localStorage.setItem("paanicare-user", JSON.stringify(updated));

    message.success("Profile updated successfully");
    console.log("✅ Profile updated:", updated);
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