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
    success: 'bg-admin-success-surface text-admin-success',
    warning: 'bg-admin-warning-surface text-admin-warning',
    danger: 'bg-admin-danger-surface text-admin-danger',
    info: 'bg-admin-info-surface text-admin-info',
    default: 'bg-admin-surface-muted text-admin-body',
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
                'inline-flex items-center px-2.5 py-0.5 rounded-none border border-current/20 text-xs font-medium',
                variantClasses[resolvedVariant],
                className
            )}
        >
            {label || 'Unknown'}
        </span>
    );
}
