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
        <label className="text-sm font-medium text-gray-700 flex items-center min-h-[24px]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
            'w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
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
