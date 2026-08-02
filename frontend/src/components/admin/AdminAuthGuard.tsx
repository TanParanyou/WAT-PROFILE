'use client';

import React, { useEffect } from 'react';
import { useRouter } from "@/navigation";
import { useTranslations } from 'next-intl';
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
    const t = useTranslations("Admin");
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/admin/login');
        }
    }, [isLoading, isAuthenticated, router]);

    // กำลังโหลด
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-admin-canvas">
                <PageLoading text={t("auth.checkingAccess")} />
            </div>
        );
    }

    // ไม่ได้ login — รอ redirect
    if (!isAuthenticated || !user) {
        return null;
    }

    return <>{children}</>;
}
