'use client';

import type { ElementType } from 'react';
import { CheckCircle2, Loader2, AlertCircle, Info, TriangleAlert, X } from 'lucide-react';
import { useToast, type Toast as ToastType, type ToastType as TType } from '@/hooks/useToast';
import { cn } from '@/utils/cn';

const iconMap: Record<TType, ElementType> = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: TriangleAlert,
    info: Info,
    loading: Loader2,
};

const toneMap: Record<TType, string> = {
    success: 'border-admin-border dark:border-[#23432b] border-l-admin-success border-l-[5px] bg-admin-surface dark:bg-[#16241a] text-admin-foreground',
    error: 'border-admin-border dark:border-[#4a2225] border-l-admin-danger border-l-[5px] bg-admin-surface dark:bg-[#281618] text-admin-foreground',
    warning: 'border-admin-border dark:border-[#46371f] border-l-admin-warning border-l-[5px] bg-admin-surface dark:bg-[#261f14] text-admin-foreground',
    info: 'border-admin-border dark:border-[#223652] border-l-admin-info border-l-[5px] bg-admin-surface dark:bg-[#142030] text-admin-foreground',
    loading: 'border-admin-border dark:border-admin-border/80 border-l-admin-muted border-l-[5px] bg-admin-surface dark:bg-admin-surface text-admin-foreground',
};

const iconToneMap: Record<TType, string> = {
    success: 'text-admin-success',
    error: 'text-admin-danger',
    warning: 'text-admin-warning',
    info: 'text-admin-info',
    loading: 'text-admin-muted',
};

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="admin-theme pointer-events-none fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6 sm:w-full">
            {toasts.map((toast) => {
                const Icon = iconMap[toast.type];

                return (
                    <div
                        key={toast.id}
                        role="status"
                        aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
                        className={cn(
                            'pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-200',
                            toneMap[toast.type],
                        )}
                    >
                        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconToneMap[toast.type], toast.type === 'loading' && 'animate-spin')} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-5 text-admin-foreground">{toast.message}</p>
                            {toast.description ? (
                                <p className="mt-1 text-xs leading-5 text-admin-muted">{toast.description}</p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Dismiss toast"
                            className="rounded p-1 text-admin-muted transition hover:bg-admin-surface-muted hover:text-admin-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
