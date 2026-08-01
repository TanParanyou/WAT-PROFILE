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
    success: 'border-admin-border border-l-admin-success border-l-[6px] bg-admin-surface text-admin-foreground shadow-xl',
    error: 'border-admin-border border-l-admin-danger border-l-[6px] bg-admin-surface text-admin-foreground shadow-xl',
    warning: 'border-admin-border border-l-admin-warning border-l-[6px] bg-admin-surface text-admin-foreground shadow-xl',
    info: 'border-admin-border border-l-admin-info border-l-[6px] bg-admin-surface text-admin-foreground shadow-xl',
    loading: 'border-admin-border border-l-admin-muted border-l-[6px] bg-admin-surface text-admin-foreground shadow-xl',
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
        <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6 sm:w-full">
            {toasts.map((toast) => {
                const Icon = iconMap[toast.type];

                return (
                    <div
                        key={toast.id}
                        role="status"
                        aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
                        className={cn(
                            'pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 backdrop-blur-sm',
                            toneMap[toast.type],
                        )}
                    >
                        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconToneMap[toast.type], toast.type === 'loading' && 'animate-spin')} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-5">{toast.message}</p>
                            {toast.description ? (
                                <p className="mt-1 text-xs leading-5 text-current/70">{toast.description}</p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Dismiss toast"
                            className="rounded-sm p-1 text-current/50 transition hover:bg-black/5 hover:text-current"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
