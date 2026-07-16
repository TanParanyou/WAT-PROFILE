'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="space-y-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            ref={ref}
                            {...props}
                        />
                        <div className={cn(
                            "w-9 h-5 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out",
                            "peer-checked:bg-amber-600 peer-focus:ring-2 peer-focus:ring-amber-500 peer-focus:ring-offset-2",
                            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
                            className
                        )}></div>
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm peer-checked:translate-x-4 peer-disabled:opacity-50"></div>
                    </div>
                    {label && (
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                    )}
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);

Switch.displayName = 'Switch';

export { Switch };
