'use client';

import { useLocale } from "next-intl";
import { formatDate, formatDateTime, formatDateRange, formatTime, formatTimeRange } from "@/utils/formatters";

export function useDateFormat() {
  const locale = useLocale();

  return {
    formatDate: (date: string | Date | null | undefined) => formatDate(date, locale),
    formatDateTime: (date: string | Date | null | undefined) => formatDateTime(date, locale),
    formatDateRange: (
      start: string | Date | null | undefined,
      end: string | Date | null | undefined
    ) => formatDateRange(start, end, locale),
    formatTime: (time: string | Date | null | undefined) => formatTime(time, locale),
    formatTimeRange: (
      start: string | Date | null | undefined,
      end: string | Date | null | undefined
    ) => formatTimeRange(start, end, locale),
  };
}

