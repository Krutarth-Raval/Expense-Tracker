"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useSyncExternalStore,
} from "react";

export type AuthScreen = "login" | "signup" | "otp";

export interface AuthUser {
  id?: string;
  email: string;
  salaryDate?: string | Date | null;
  salaryDay?: number | null;
  salaryAmount?: number | null;
  salaryConfigured?: boolean | null;
  salaryPromptedAt?: string | Date | null;
  initialSavings?: number | null;
  initialMonthBalance?: number | null;
  onboardingCompleted?: boolean | null;
  defaultPaymentApp?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  authScreen: AuthScreen;
  setAuthScreen: (screen: AuthScreen) => void;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserProfile: (data: Partial<AuthUser>) => void;
}

const AUTH_STORAGE_KEY = "expense_tracker_auth_session";

// Global subscriber set for external store synchronization (React 19 compliant)
const authListeners = new Set<() => void>();

function notifyAuthListeners() {
  authListeners.forEach((listener) => listener());
}

function subscribeAuth(callback: () => void) {
  authListeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === AUTH_STORAGE_KEY) {
      notifyAuthListeners();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
    return () => {
      authListeners.delete(callback);
      window.removeEventListener("storage", handleStorage);
    };
  }

  return () => {
    authListeners.delete(callback);
  };
}

function getAuthSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getAuthServerSnapshot(): string {
  return "";
}

// Client mount detector without synchronous setState in effect
function subscribeMount() {
  return () => {};
}
function getMountSnapshot(): boolean {
  return true;
}
function getMountServerSnapshot(): boolean {
  return false;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isMounted = useSyncExternalStore(
    subscribeMount,
    getMountSnapshot,
    getMountServerSnapshot
  );

  const rawSession = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getAuthServerSnapshot
  );

  const user: AuthUser | null = useMemo(() => {
    if (!rawSession) return null;
    try {
      const parsed = JSON.parse(rawSession);
      if (parsed?.user?.email) {
        return parsed.user;
      }
      return null;
    } catch {
      return null;
    }
  }, [rawSession]);

  const isAuthenticated = Boolean(user && user.email);
  const isLoading = !isMounted;

  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [pendingPassword, setPendingPassword] = useState<string>("");

  // Background verification: check if authenticated user still exists in DB
  const userEmail = user?.email;
  useEffect(() => {
    if (!userEmail) return;

    let isCancelled = false;

    fetch("/api/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail }),
    })
      .then(async (res) => {
        if (isCancelled) return;
        if (res.status === 404) {
          // Account was deleted from database
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch (e) {
            console.error("Failed to remove session:", e);
          }
          notifyAuthListeners();
        }
      })
      .catch((err) => {
        console.warn("Background auth verification deferred:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [userEmail]);

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = email.trim();
      if (!cleanEmail || !password) {
        return { success: false, error: "Please enter your email and password" };
      }

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Invalid credentials" };
        }

        const authenticatedUser = data.user;

        // Persist session to localStorage across page reloads
        try {
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({ user: authenticatedUser, savedAt: Date.now() })
          );
        } catch (e) {
          console.error("Failed to write auth session to localStorage:", e);
        }

        notifyAuthListeners();
        return { success: true };
      } catch (err) {
        console.error("Login network error:", err);
        return { success: false, error: "Network error. Please try again." };
      }
    },
    []
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      confirmPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        return { success: false, error: "Email is required" };
      }
      if (!password) {
        return { success: false, error: "Password is required" };
      }
      if (password !== confirmPassword) {
        return { success: false, error: "Passwords do not match" };
      }
      if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" };
      }

      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Failed to send code" };
        }

        setPendingEmail(cleanEmail);
        setPendingPassword(password);
        setAuthScreen("otp");
        return { success: true };
      } catch (err) {
        console.error("Signup network error:", err);
        return { success: false, error: "Network error. Please try again." };
      }
    },
    []
  );

  const verifyOtp = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      const cleanCode = code.trim();
      if (cleanCode.length < 4) {
        return { success: false, error: "Please enter the verification code" };
      }

      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: pendingEmail,
            code: cleanCode,
            password: pendingPassword,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data.error || "Invalid or expired code",
          };
        }

        const authenticatedUser = data.user;
        setPendingPassword("");

        // Persist session to localStorage across page reloads
        try {
          localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({ user: authenticatedUser, savedAt: Date.now() })
          );
        } catch (e) {
          console.error("Failed to write auth session to localStorage:", e);
        }

        notifyAuthListeners();
        return { success: true };
      } catch (err) {
        console.error("Verify OTP network error:", err);
        return { success: false, error: "Network error. Please try again." };
      }
    },
    [pendingEmail, pendingPassword]
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to remove auth session from localStorage:", e);
    }
    notifyAuthListeners();
    setAuthScreen("login");
    setPendingPassword("");
  }, []);

  const updateUserProfile = useCallback((data: Partial<AuthUser>) => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updatedUser = { ...parsed.user, ...data };
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ user: updatedUser, savedAt: Date.now() })
        );
        notifyAuthListeners();
      }
    } catch (e) {
      console.error("Failed to update user profile in localStorage:", e);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        authScreen,
        setAuthScreen,
        pendingEmail,
        setPendingEmail,
        login,
        signup,
        verifyOtp,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
