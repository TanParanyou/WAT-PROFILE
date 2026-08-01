'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, id, required, ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-admin-body flex items-center min-h-[24px]">
                        {label}
                        {required && <span className="text-admin-danger ml-1">*</span>}
                    </label>
                )}
                <select
                    id={id}
                    ref={ref}
                    required={required}
                    className={cn(
                        'min-h-11 w-full rounded-lg border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground',
                        'focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus',
                        'disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted',
                        error && 'border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger',
                        className
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="">{placeholder}</option>
                    )}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="text-sm text-admin-danger">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export { Select };
export type { SelectOption, SelectProps };
