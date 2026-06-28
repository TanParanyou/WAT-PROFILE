'use client';

import { QueryProvider } from '@/components/providers/QueryProvider';
import { ToastContainer } from '@/components/admin/Toast';
import { ToastProvider } from '@/hooks/useToast';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <ToastProvider>
                {children}
                <ToastContainer />
            </ToastProvider>
        </QueryProvider>
    );
}
