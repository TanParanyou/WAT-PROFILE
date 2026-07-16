'use client';

import React from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
    label: string;
    variant?: BadgeVariant;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    default: 'bg-gray-100 text-gray-700',
};

// Mapping สถานะภาษาอังกฤษเป็น variant
const statusVariantMap: Record<string, BadgeVariant> = {
    active: 'success',
    confirmed: 'success',
    replied: 'success',
    read: 'info',
    pending: 'warning',
    new: 'warning',
    inactive: 'default',
    archived: 'default',
    cancelled: 'danger',
};

export function StatusBadge({ label, variant, className }: StatusBadgeProps) {
    const safeLabel = label || '';
    const resolvedVariant = variant || statusVariantMap[safeLabel.toLowerCase()] || 'default';

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                variantClasses[resolvedVariant],
                className
            )}
        >
            {label || 'Unknown'}
        </span>
    );
}
