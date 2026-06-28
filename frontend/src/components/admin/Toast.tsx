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
    success: 'border-emerald-500/30 bg-emerald-50 text-emerald-950',
    error: 'border-rose-500/30 bg-rose-50 text-rose-950',
    warning: 'border-amber-500/30 bg-amber-50 text-amber-950',
    info: 'border-slate-500/30 bg-slate-50 text-slate-950',
    loading: 'border-zinc-500/30 bg-zinc-50 text-zinc-950',
};

const iconToneMap: Record<TType, string> = {
    success: 'text-emerald-600',
    error: 'text-rose-600',
    warning: 'text-amber-600',
    info: 'text-slate-600',
    loading: 'text-zinc-600',
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
                            'pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-lg backdrop-blur-sm',
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
