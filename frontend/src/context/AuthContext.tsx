"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import adminAuthService from "@/services/adminAuthService";
import { setAdminAuthLostHandler } from "@/services/adminAuthStore";
import type { User, LoginRequest, UpdateProfileRequest } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // โหลด admin session จาก refresh credential ตอนเริ่ม
  const refreshUser = useCallback(async () => {
    try {
      const result = await adminAuthService.refresh();
      setSessionExpired(false);
      setUser(result.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    setAdminAuthLostHandler(() => {
      setUser(null);
      setSessionExpired(true);
    });
    return () => setAdminAuthLostHandler(null);
  }, []);

  const login = async (data: LoginRequest) => {
    const result = await adminAuthService.login(data);
    setSessionExpired(false);
    setUser(result.user);
  };

  const logout = async () => {
    await adminAuthService.logout();
    setSessionExpired(false);
    setUser(null);
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
    const updated = await adminAuthService.updateProfile(data);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionExpired,
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
