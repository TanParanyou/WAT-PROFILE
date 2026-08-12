'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from "@/navigation";
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { PageLoading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, LogIn } from 'lucide-react';

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

/**
 * AdminAuthGuard — ตรวจ auth + redirect ถ้าไม่ได้ login
 * แสดง Modal บังคับ login ใหม่เมื่อ admin token หมดอายุ (401)
 */
export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const { user, isLoading, isAuthenticated, sessionExpired } = useAuth();
    const t = useTranslations("Admin");
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !sessionExpired) {
            const current = encodeURIComponent(pathname);
            router.replace(`/admin/login?returnTo=${current}`);
        }
    }, [isLoading, isAuthenticated, sessionExpired, router, pathname]);

    // กำลังโหลด
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-admin-canvas">
                <PageLoading text={t("auth.checkingAccess")} />
            </div>
        );
    }

    // กรณี Token หมดอายุ (sessionExpired = true) — แสดง Modal บังคับให้ Login ใหม่
    if (sessionExpired) {
        return (
            <>
                <div className="pointer-events-none opacity-40 select-none aria-hidden:true">
                    {children}
                </div>
                <Modal
                    isOpen={true}
                    onClose={() => {}}
                    title={t("login.sessionExpiredTitle")}
                    showCloseButton={false}
                    closeOnOverlayClick={false}
                    closeOnEscape={false}
                    size="md"
                >
                    <div className="py-2">
                        <div className="flex items-center gap-3 p-3 mb-4 rounded-none bg-admin-danger/10 text-admin-danger border border-admin-danger/20">
                            <AlertTriangle size={24} className="shrink-0" />
                            <p className="text-sm font-medium">
                                {t("login.sessionExpiredDetail")}
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                const current = encodeURIComponent(pathname);
                                router.replace(`/admin/login?returnTo=${current}`);
                            }}
                            variant="danger"
                            className="w-full flex items-center justify-center gap-2 min-h-11 font-medium"
                        >
                            <LogIn size={18} />
                            {t("login.reloginButton")}
                        </Button>
                    </div>
                </Modal>
            </>
        );
    }

    // ไม่ได้ login — รอ redirect
    if (!isAuthenticated || !user) {
        return null;
    }

    return <>{children}</>;
}
