'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: React.ReactNode;
    error?: string;
    description?: string;
    variant?: 'admin' | 'public';
    labelClassName?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, error, description, disabled, variant = 'admin', labelClassName, id, ...props }, ref) => {
        const isPublic = variant === 'public';
        
        return (
            <div className="space-y-1">
                <label
                    htmlFor={id}
                    className={cn(
                        "flex items-start gap-2.5 cursor-pointer select-none",
                        disabled && "cursor-not-allowed opacity-60"
                    )}
                >
                    <input
                        id={id}
                        type="checkbox"
                        disabled={disabled}
                        className={cn(
                            'h-4 w-4 shrink-0 rounded transition-colors disabled:cursor-not-allowed mt-0.5',
                            isPublic
                                ? 'border-site-border bg-site-canvas accent-site-accent text-site-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-site-focus'
                                : 'border-admin-control-border bg-admin-surface accent-admin-focus text-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {(label || description) && (
                        <div className="space-y-0.5">
                            {label && (
                                <span className={cn("text-sm font-medium", isPublic ? "text-site-body" : "text-admin-body", labelClassName)}>
                                    {label}
                                </span>
                            )}
                            {description && (
                                <p className={cn("text-xs", isPublic ? "text-site-muted" : "text-admin-muted")}>
                                    {description}
                                </p>
                            )}
                        </div>
                    )}
                </label>
                {error && (
                    <p className={cn("text-xs mt-1", isPublic ? "text-site-danger" : "text-admin-danger")}>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
