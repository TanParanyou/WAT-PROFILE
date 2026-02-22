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
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, id, ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <select
                    id={id}
                    ref={ref}
                    className={cn(
                        'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900',
                        'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
                        'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                        error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
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
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export { Select };
export type { SelectOption, SelectProps };
