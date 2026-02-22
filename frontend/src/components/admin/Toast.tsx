'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { Toast as ToastType, ToastType as TType } from '@/hooks/useToast';

const iconMap: Record<TType, React.ElementType> = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap: Record<TType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColorMap: Record<TType, string> = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
};

interface ToastContainerProps {
    toasts: ToastType[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map((t) => {
                const Icon = iconMap[t.type];
                return (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md ${colorMap[t.type]}`}
                    >
                        <Icon size={18} className={iconColorMap[t.type]} />
                        <p className="text-sm flex-1">{t.message}</p>
                        <button onClick={() => onRemove(t.id)} className="opacity-50 hover:opacity-100">
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
