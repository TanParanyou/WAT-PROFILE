'use client';

import React, { useMemo } from 'react';
import ReactDatePicker from 'react-datepicker';
import { cn } from '@/utils/cn';
import { formatTimeToHHmm } from '@/utils/formatters';
import { de, enUS, th } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { DatePickerLocale, DatePickerVariant } from './DatePicker';
import 'react-datepicker/dist/react-datepicker.css';

export type { DatePickerLocale, DatePickerVariant } from './DatePicker';

const dateFnsLocales = { th, en: enUS, de } satisfies Record<DatePickerLocale, DateFnsLocale>;

const inputVariantClasses: Record<DatePickerVariant, string> = {
    admin: 'min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted',
    public: 'min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2 text-base text-site-foreground placeholder:text-site-muted focus-visible:border-site-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:bg-site-surface disabled:text-site-muted',
};

const errorVariantClasses: Record<DatePickerVariant, string> = {
    admin: 'border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger',
    public: 'border-site-danger focus-visible:border-site-danger focus-visible:outline-site-danger',
};

interface TimePickerProps {
    value?: string | null;
    onChange?: (value: string) => void;
    label?: string;
    error?: string;
    id?: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    variant?: DatePickerVariant;
    locale?: DatePickerLocale;
    timeCaption?: string;
}

const parseTimeString = (timeStr?: string | null): Date | null => {
    const formatted = formatTimeToHHmm(timeStr);
    if (!formatted) return null;
    const [hours, minutes] = formatted.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
};

const formatAsTimeMask = (val: string, prevVal: string): string => {
    if (prevVal && prevVal.length > val.length) {
        return val;
    }
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.length <= 2) {
        return digits;
    }
    const hh = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    
    let validHH = hh;
    if (parseInt(hh, 10) > 23) {
        validHH = '23';
    }
    let validMM = mm;
    if (mm && parseInt(mm, 10) > 59) {
        validMM = '59';
    }
    
    return `${validHH}:${validMM}`;
};

interface CustomTimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value?: string;
}

const CustomTimeInput = React.forwardRef<HTMLInputElement, CustomTimeInputProps>(
    ({ value, onClick, onChange, onKeyDown, className, ...rest }, ref) => {
        const [displayVal, setDisplayVal] = React.useState(() => formatTimeToHHmm(value) || value || '');

        React.useEffect(() => {
            setDisplayVal(formatTimeToHHmm(value) || value || '');
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const rawVal = e.target.value;
            const formatted = formatAsTimeMask(rawVal, displayVal);
            setDisplayVal(formatted);
            
            if (onChange) {
                e.target.value = formatted;
                onChange(e);
            }
        };

        return (
            <input
                {...rest}
                ref={ref}
                value={displayVal}
                onChange={handleChange}
                onClick={onClick}
                onKeyDown={onKeyDown}
                className={className}
            />
        );
    }
);
CustomTimeInput.displayName = 'CustomTimeInput';

export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
    ({ value, onChange, label, error, id, required, disabled, placeholder, className, variant = 'admin', locale = 'en', timeCaption }, ref) => {
        const selectedDate = useMemo(() => parseTimeString(value), [value]);

        const formatTimeToStr = (date: Date | null): string => {
            if (!date) return '';
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        const handleChange = (date: Date | null) => {
            if (onChange) {
                onChange(formatTimeToStr(date));
            }
        };
        const errorId = id ? `${id}-error` : undefined;
        const defaultPlaceholder = variant === 'public' ? 'Choose a time' : 'เลือกเวลา';

        return (
            <div className={cn('w-full space-y-1', className)} ref={ref}>
                {label && (
                    <label htmlFor={id} className={cn(
                        'flex min-h-[24px] items-center text-sm font-medium',
                        variant === 'public' ? 'text-site-foreground' : 'text-admin-body',
                    )}>
                        {label}
                        {required && <span className={cn('ml-1', variant === 'public' ? 'text-site-danger' : 'text-admin-danger')}>*</span>}
                    </label>
                )}
                <div className="relative">
                    <ReactDatePicker
                        id={id}
                        selected={selectedDate}
                        onChange={handleChange}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption={timeCaption ?? 'Time'}
                        timeFormat="HH:mm"
                        dateFormat="HH:mm"
                        disabled={disabled}
                        locale={dateFnsLocales[locale]}
                        placeholderText={placeholder ?? defaultPlaceholder}
                        customInput={<CustomTimeInput />}
                        portalId={variant === 'public' ? 'public-modal-root' : undefined}
                        calendarClassName={variant === 'public' ? 'site-date-picker-calendar site-time-picker-calendar' : undefined}
                        popperClassName={variant === 'public' ? 'site-date-picker-popper' : undefined}
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={errorId}
                        className={cn(
                            inputVariantClasses[variant],
                            error && errorVariantClasses[variant],
                        )}
                        wrapperClassName="w-full"
                        selectsRange={false}
                        selectsMultiple={false}
                    />
                </div>
                {variant === 'public' ? (
                    <div className="min-h-4">
                        {error ? <p id={errorId} role="alert" className="text-sm leading-4 text-site-danger">{error}</p> : null}
                    </div>
                ) : (
                    error && <p id={errorId} role="alert" className="text-sm text-admin-danger mt-1">{error}</p>
                )}
            </div>
        );
    }
);

TimePicker.displayName = 'TimePicker';
