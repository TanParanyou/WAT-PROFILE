'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/cn';
import 'react-datepicker/dist/react-datepicker.css';

interface DateRangePickerProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  label?: string;
  placeholderText?: string;
  error?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  size?: 'sm' | 'md';
}

export function DateRangePicker({
  value,
  onChange,
  label,
  placeholderText,
  error,
  required,
  className,
  inputClassName,
  labelClassName,
  size = 'md',
}: DateRangePickerProps) {
  const tPicker = useTranslations("Admin.common.picker");
  const defaultPlaceholder = placeholderText || tPicker("chooseDateRange");
  const handleChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    onChange({
      from: start || undefined,
      to: end || undefined,
    });
  };

  const isSmall = size === 'sm';

  return (
    <div className={cn(isSmall ? 'flex flex-col gap-1 w-full' : 'flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          className={cn(
            isSmall
              ? "text-xs font-medium text-admin-body h-5 min-h-[20px] flex items-center"
              : "text-sm font-medium text-admin-body flex items-center min-h-[24px]",
            labelClassName
          )}
        >
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
          placeholderText={defaultPlaceholder}
          isClearable={true}
          className={cn(
            isSmall
              ? 'h-10 min-h-10 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-1.5 text-xs sm:text-sm text-admin-foreground placeholder:text-admin-muted'
              : 'h-11 min-h-10 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-1.5 text-xs sm:text-sm text-admin-foreground placeholder:text-admin-muted',
            'focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus',
            'disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted',
            error && 'border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger',
            inputClassName
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
