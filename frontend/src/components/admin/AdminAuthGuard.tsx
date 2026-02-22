'use client';

import React, { useEffect } from 'react';
import { useRouter } from "@/navigation";
import { useAuth } from '@/hooks/useAuth';
import { PageLoading } from '@/components/ui/Loading';

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

/**
 * AdminAuthGuard — ตรวจ auth + redirect ถ้าไม่ได้ login
 * ใช้ครอบ admin layout
 */
export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/admin/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // กำลังโหลด
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <PageLoading text="กำลังตรวจสอบสิทธิ์..." />
            </div>
        );
    }

    // ไม่ได้ login — รอ redirect
    if (!isAuthenticated || !user) {
        return null;
    }

    return <>{children}</>;
}
