'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import 'react-day-picker/dist/style.css';

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (range: DateRange | undefined) => {
    onChange({
      from: range?.from,
      to: range?.to,
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ from: undefined, to: undefined });
  };

  const formatDisplayDate = () => {
    if (!value.from) return 'เลือกช่วงเวลา';
    if (!value.to) return `${format(value.from, 'dd/MM/yyyy')} - ...`;
    return `${format(value.from, 'dd/MM/yyyy')} - ${format(value.to, 'dd/MM/yyyy')}`;
  };

  return (
    <div className={cn('space-y-1 relative', className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700 flex items-center min-h-[24px]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 text-left cursor-pointer select-none',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-amber-500/50 focus-within:border-amber-500',
            error && 'border-red-500 focus-within:ring-red-500/50 focus-within:border-red-500'
          )}
        >
          <span className="flex items-center gap-2 text-zinc-700">
            <CalendarIcon size={16} className="text-zinc-400" />
            {formatDisplayDate()}
          </span>
          {value.from && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors z-10"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-2 p-3 bg-white border border-zinc-200 rounded-xl shadow-xl left-0 md:left-auto md:right-0 [--rdp-accent-color:#b45309] [--rdp-accent-text-color:#ffffff] [--rdp-range_middle-background-color:#fef3c7] [--rdp-range_middle-color:#78350f]">
            <DayPicker
              mode="range"
              selected={{
                from: value.from,
                to: value.to,
              }}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
