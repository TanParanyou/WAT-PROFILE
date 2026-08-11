'use client';

import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { cn } from '@/utils/cn';
import 'react-datepicker/dist/react-datepicker.css';

import { de, enUS, th } from 'date-fns/locale';
import { format, parse, type Locale as DateFnsLocale } from 'date-fns';

export type DatePickerVariant = 'admin' | 'public';
export type DatePickerLocale = 'th' | 'en' | 'de';

const dateFnsLocales = { th, en: enUS, de } satisfies Record<DatePickerLocale, DateFnsLocale>;

const inputVariantClasses: Record<DatePickerVariant, string> = {
  admin: 'min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted',
  public: 'min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2 text-base text-site-foreground placeholder:text-site-muted focus-visible:border-site-focus focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:bg-site-surface disabled:text-site-muted',
};

const errorVariantClasses: Record<DatePickerVariant, string> = {
  admin: 'border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger',
  public: 'border-site-danger focus-visible:border-site-danger focus-visible:outline-site-danger',
};

interface DatePickerProps {
  value?: string | null;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  id?: string;
  variant?: DatePickerVariant;
  locale?: DatePickerLocale;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  required,
  className,
  id,
  variant = 'admin',
  locale = 'en',
  placeholder,
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
  const errorId = id ? `${id}-error` : undefined;
  const defaultPlaceholder = variant === 'public' ? 'Choose a date' : 'เลือกวันที่';

  return (
    <div className={cn('space-y-1 w-full', className)}>
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
          selected={parseDateString(value)}
          onChange={(date: Date | null) => onChange?.(formatDateToStr(date))}
          dateFormat="dd/MM/yyyy"
          locale={dateFnsLocales[locale]}
          placeholderText={placeholder ?? defaultPlaceholder}
          isClearable={true}
          portalId={variant === 'public' ? 'public-modal-root' : undefined}
          calendarClassName={variant === 'public' ? 'site-date-picker-calendar' : undefined}
          popperClassName={variant === 'public' ? 'site-date-picker-popper' : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={cn(
            inputVariantClasses[variant],
            error && errorVariantClasses[variant],
            className
          )}
          wrapperClassName="w-full"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          selectsRange={false}
          selectsMultiple={false}
        />
      </div>
      <div className={variant === 'public' ? 'min-h-4' : 'min-h-5'}>
        {error ? <p id={errorId} role="alert" className={cn('text-sm leading-4', variant === 'public' ? 'text-site-danger' : 'text-admin-danger')}>{error}</p> : null}
      </div>
    </div>
  );
}
