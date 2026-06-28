'use client';

import { QueryProvider } from '@/components/providers/QueryProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    return <QueryProvider>{children}</QueryProvider>;
}
