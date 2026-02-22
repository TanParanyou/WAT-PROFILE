'use client';

import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AdminHeader() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/admin/login';
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
            <div />

            <div className="flex items-center gap-4">
                {/* User info */}
                <div className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <User size={16} className="text-amber-700" />
                    </div>
                    <div className="hidden sm:block">
                        <p className="font-medium text-gray-700">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.role?.name}</p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                    title="ออกจากระบบ"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
