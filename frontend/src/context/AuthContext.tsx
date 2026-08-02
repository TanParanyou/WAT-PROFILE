"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authService from "@/services/authService";
import type { User, LoginRequest, UpdateProfileRequest } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
}


const AuthContext = createContext<AuthContextType | null>(null);

const skipAdminAuth = process.env.NEXT_PUBLIC_SKIP_ADMIN_AUTH === "true";

const mockAdminUser: User = {
  id: "mock-admin",
  email: "admin@wat.local",
  name: "Mock Admin",
  role_id: "mock-admin-role",
  role: {
    id: "mock-admin-role",
    name: "admin",
    description: "Mock admin for frontend review",
    permissions: {
      events: "all",
      monks: "all",
      gallery: "all",
      schedules: "all",
      donations: "all",
      members: "all",
      contacts: "all",
      settings: "all",
      users: "all",
      registrations: "all",
      audit_logs: "all",
      website: "all",
    },
    admin_access: true,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  email_verified: true,
  is_active: true,
  last_login_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(skipAdminAuth ? mockAdminUser : null);
  const [isLoading, setIsLoading] = useState(!skipAdminAuth);

  // โหลด user จาก token ตอนเริ่ม
  const refreshUser = useCallback(async () => {
    if (skipAdminAuth) {
      setUser(mockAdminUser);
      return;
    }

    try {
      if (typeof window !== "undefined" && authService.isAuthenticated()) {
        const profile = await authService.getProfile();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      authService.logout();
    }
  }, []);

  useEffect(() => {
    if (skipAdminAuth) return;

    let isMounted = true;
    const init = async () => {
      await refreshUser();
      if (isMounted) setIsLoading(false);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  const login = async (data: LoginRequest) => {
    if (skipAdminAuth) {
      setUser(mockAdminUser);
      return;
    }

    const result = await authService.login(data);
    setUser(result.user);
  };

  const logout = () => {
    if (skipAdminAuth) {
      setUser(mockAdminUser);
      return;
    }

    authService.logout();
    setUser(null);
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
    if (skipAdminAuth) {
      const updated: User = user
        ? {
            ...user,
            name: data.name ?? user.name,
            email: data.email ?? user.email,
            avatar_url: data.avatar_url !== undefined ? data.avatar_url : user.avatar_url,
          }
        : mockAdminUser;
      setUser(updated);
      return updated;
    }

    const updated = await authService.updateProfile(data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
