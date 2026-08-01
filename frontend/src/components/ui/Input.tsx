'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', label, error, id, required, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === 'password';
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
            <div className="space-y-1">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-admin-body flex items-center min-h-[24px]">
                        {label}
                        {required && <span className="text-admin-danger ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    <input
                        type={inputType}
                        id={id}
                        required={required}
                        className={cn(
                            'min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted',
                            'focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus',
                            'disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted',
                            isPassword && 'pr-10',
                            error && 'border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-admin-muted hover:text-admin-foreground"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    )}
                </div>
                {error && <p className="text-sm text-admin-danger">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
