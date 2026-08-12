'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import { cn } from '@/utils/cn';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  label,
  error,
  required,
  className,
}: DateRangePickerProps) {
  const handleChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    onChange({
      from: start || undefined,
      to: end || undefined,
    });
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label className="text-xs font-medium text-admin-body flex items-center h-5 min-h-[20px]">
          {label}
          {required && <span className="text-admin-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <DatePicker
          selectsRange={true}
          startDate={value.from ?? null}
          endDate={value.to ?? null}
          onChange={handleChange}
          dateFormat="dd/MM/yyyy"
          placeholderText="เลือกช่วงเวลา"
          isClearable={true}
          className={cn(
            'h-10 min-h-10 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-1.5 text-xs sm:text-sm text-admin-foreground placeholder:text-admin-muted',
            'focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus',
            'disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted',
            error && 'border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger'
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
