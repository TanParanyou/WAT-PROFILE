'use client';

import { QueryProvider } from '@/components/providers/QueryProvider';
import { ToastContainer } from '@/components/admin/Toast';
import { ToastProvider } from '@/hooks/useToast';
import { AccountSessionProvider } from '@/features/public/account/AccountSessionProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <AccountSessionProvider>
                <ToastProvider>
                    {children}
                    <ToastContainer />
                </ToastProvider>
            </AccountSessionProvider>
        </QueryProvider>
    );
}
