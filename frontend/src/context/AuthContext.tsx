'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '@/services/authService';
import type { User, LoginRequest } from '@/types/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // โหลด user จาก token ตอนเริ่ม
    const refreshUser = useCallback(async () => {
        try {
            if (typeof window !== 'undefined' && authService.isAuthenticated()) {
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
        refreshUser().finally(() => setIsLoading(false));
    }, [refreshUser]);

    const login = async (data: LoginRequest) => {
        const result = await authService.login(data);
        setUser(result.user);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
}
