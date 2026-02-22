'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className={cn(
                            'h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {label && (
                        <span className="text-sm text-gray-700">{label}</span>
                    )}
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
