'use client';

import React, { useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { cn } from '@/utils/cn';
import 'react-datepicker/dist/react-datepicker.css';

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
}

const parseTimeString = (timeStr?: string | null): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
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

const CustomTimeInput = React.forwardRef<HTMLInputElement, any>(
    ({ value, onClick, onChange, onKeyDown, className, ...rest }, ref) => {
        const [displayVal, setDisplayVal] = React.useState(value || '');

        React.useEffect(() => {
            setDisplayVal(value || '');
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
    ({ value, onChange, label, error, id, required, disabled, placeholder = 'เลือกเวลา', className }, ref) => {
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

        return (
            <div className="space-y-1 w-full" ref={ref}>
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center min-h-[24px]">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    <DatePicker
                        id={id}
                        selected={selectedDate}
                        onChange={handleChange}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        timeFormat="HH:mm"
                        dateFormat="HH:mm"
                        disabled={disabled}
                        placeholderText={placeholder}
                        customInput={<CustomTimeInput />}
                        className={cn(
                            'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
                            'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
                            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                            error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
                            className
                        )}
                        wrapperClassName="w-full"
                    />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        );
    }
);

TimePicker.displayName = 'TimePicker';
