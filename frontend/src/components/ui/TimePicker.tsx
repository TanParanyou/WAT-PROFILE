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

const formatTimeToStr = (date: Date | null): string => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
    ({ value, onChange, label, error, id, required, disabled, placeholder = 'เลือกเวลา', className }, ref) => {
        const selectedDate = useMemo(() => parseTimeString(value), [value]);

        const handleChange = (date: Date | null) => {
            if (onChange) {
                onChange(formatTimeToStr(date));
            }
        };

        const handleChangeRaw = (e: React.FocusEvent<HTMLInputElement>) => {
            const rawVal = e.target.value;
            // Clean characters: keep only digits and colon/dot
            const cleaned = rawVal.replace(/[^0-9:.]/g, '').replace('.', ':');
            
            let hours = NaN;
            let minutes = 0;

            if (cleaned.includes(':')) {
                const parts = cleaned.split(':');
                hours = parseInt(parts[0], 10);
                minutes = parseInt(parts[1] || '0', 10);
            } else if (cleaned.length === 4) {
                hours = parseInt(cleaned.slice(0, 2), 10);
                minutes = parseInt(cleaned.slice(2, 4), 10);
            } else if (cleaned.length === 3) {
                hours = parseInt(cleaned.slice(0, 1), 10);
                minutes = parseInt(cleaned.slice(1, 3), 10);
            } else if (cleaned.length > 0) {
                hours = parseInt(cleaned, 10);
            }

            if (!isNaN(hours) && hours >= 0 && hours < 24 && !isNaN(minutes) && minutes >= 0 && minutes < 60) {
                const d = new Date();
                d.setHours(hours, minutes, 0, 0);
                handleChange(d);
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
                        onChangeRaw={handleChangeRaw}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        timeFormat="HH:mm"
                        dateFormat="HH:mm"
                        disabled={disabled}
                        placeholderText={placeholder}
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
