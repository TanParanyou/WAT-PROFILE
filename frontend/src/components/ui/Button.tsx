'use client';

import React from 'react';
import { cn } from '@/utils/cn';
import { Loading } from './Loading';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-admin-action text-admin-on-action hover:bg-admin-action-hover",
    secondary: "bg-admin-surface-muted text-admin-body hover:bg-admin-border",
    danger: "bg-admin-danger text-admin-on-action hover:brightness-90",
    ghost: "text-admin-body hover:bg-admin-surface-muted",
    outline: "border border-admin-control-border bg-admin-surface text-admin-body hover:bg-admin-surface-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
    icon: 'p-1.5 text-sm',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, icon, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center gap-2 min-h-11 rounded-lg font-medium transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus disabled:opacity-50 disabled:cursor-not-allowed',
                    variantClasses[variant],
                    sizeClasses[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <Loading size="sm" />
                ) : icon ? (
                    icon
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
