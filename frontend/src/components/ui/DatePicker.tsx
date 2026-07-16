'use client';

import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { cn } from '@/utils/cn';
import 'react-datepicker/dist/react-datepicker.css';

import { format, parse } from 'date-fns';

interface DatePickerProps {
  value?: string | null;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  required,
  className,
  id,
}: DatePickerProps) {
  const parseDateString = (dateStr?: string | null): Date | null => {
    if (!dateStr) return null;
    const d = parse(dateStr, "yyyy-MM-dd", new Date());
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDateToStr = (date: Date | null): string => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className={cn('space-y-1 w-full', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center min-h-[24px]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <ReactDatePicker
          id={id}
          selected={parseDateString(value)}
          onChange={(date: Date | null) => onChange?.(formatDateToStr(date))}
          dateFormat="dd/MM/yyyy"
          placeholderText="เลือกวันที่"
          isClearable={true}
          className={cn(
            'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500',
            className
          )}
          wrapperClassName="w-full"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
