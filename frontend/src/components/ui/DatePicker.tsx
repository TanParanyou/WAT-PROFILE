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
        <label htmlFor={id} className="text-sm font-medium text-admin-body flex items-center min-h-[24px]">
          {label}
          {required && <span className="text-admin-danger ml-1">*</span>}
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
            'min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted',
            'focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus',
            'disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted',
            error && 'border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger',
            className
          )}
          wrapperClassName="w-full"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
      {error && <p className="text-sm text-admin-danger">{error}</p>}
    </div>
  );
}
